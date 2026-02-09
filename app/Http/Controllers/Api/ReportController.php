<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $startParam = $request->query('start');
        $endParam = $request->query('end');
        $status = $request->query('status');
        $includeDrafts = filter_var($request->query('include_drafts', false), FILTER_VALIDATE_BOOL);
        $projectId = $request->query('project_id');
        $userId = $request->query('user_id');
        $sort = $request->query('sort', 'total_minutes');
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $page = max((int) $request->query('page', 1), 1);
        $perPage = max((int) $request->query('per_page', 10), 1);

        $start = $startParam
            ? Carbon::parse($startParam)->startOfDay()
            : now()->startOfWeek();
        $end = $endParam
            ? Carbon::parse($endParam)->endOfDay()
            : now()->endOfWeek();

        if ($start->gt($end)) {
            [$start, $end] = [$end, $start];
        }

        $cacheKey = 'reports:' . $user->id . ':' . md5(json_encode([
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'status' => $status,
            'include_drafts' => $includeDrafts,
            'project_id' => $projectId,
            'user_id' => $userId,
            'sort' => $sort,
            'direction' => $direction,
            'page' => $page,
            'per_page' => $perPage,
            'is_admin' => (bool) $user->is_admin,
        ]));

        $payload = Cache::remember($cacheKey, now()->addMinutes(5), function () use (
            $user,
            $start,
            $end,
            $status,
            $includeDrafts,
            $projectId,
            $userId,
            $sort,
            $direction,
            $page,
            $perPage
        ) {
            $query = Timesheet::query()
                ->select('id', 'user_id', 'work_date', 'total_minutes', 'status', 'submitted_at')
                ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()]);

            if (!$user->is_admin) {
                $query->where('user_id', $user->id);
            } elseif ($userId) {
                $query->where('user_id', $userId);
            }

            if ($status && in_array($status, ['draft', 'submitted', 'approved', 'rejected'], true)) {
                $query->where('status', $status);
            } elseif (!$includeDrafts) {
                $query->whereIn('status', ['submitted', 'approved']);
            }

            $timesheets = $query->get();

            $timesheetIds = $timesheets->pluck('id');
            $userIds = $timesheets->pluck('user_id')->unique();

            $entryTotals = $timesheetIds->isNotEmpty()
                ? TimeEntry::query()
                    ->select('timesheet_id', DB::raw('SUM(duration_minutes) as total_minutes'))
                    ->when($projectId, fn ($entryQuery) => $entryQuery->where('project_id', $projectId))
                    ->whereIn('timesheet_id', $timesheetIds)
                    ->groupBy('timesheet_id')
                    ->get()
                    ->keyBy('timesheet_id')
                : collect();

            $projectTotalsRaw = $timesheetIds->isNotEmpty()
                ? TimeEntry::query()
                    ->select('timesheets.user_id', 'time_entries.project_id', DB::raw('SUM(time_entries.duration_minutes) as total_minutes'))
                    ->join('timesheets', 'timesheets.id', '=', 'time_entries.timesheet_id')
                    ->when($projectId, fn ($entryQuery) => $entryQuery->where('time_entries.project_id', $projectId))
                    ->whereIn('time_entries.timesheet_id', $timesheetIds)
                    ->groupBy('timesheets.user_id', 'time_entries.project_id')
                    ->get()
                : collect();

            $projectNames = $projectTotalsRaw->isNotEmpty()
                ? Project::query()
                    ->whereIn('id', $projectTotalsRaw->pluck('project_id')->filter()->unique())
                    ->pluck('name', 'id')
                : collect();

            $projectTotalsByUser = $projectTotalsRaw
                ->groupBy('user_id')
                ->map(function ($entries) use ($projectNames) {
                    return $entries->map(function ($entry) use ($projectNames) {
                        $projectIdValue = $entry->project_id;
                        return [
                            'id' => $projectIdValue ? (int) $projectIdValue : null,
                            'name' => $projectIdValue
                                ? ($projectNames[$projectIdValue] ?? 'Unknown project')
                                : 'No project',
                            'total_minutes' => (int) $entry->total_minutes,
                        ];
                    })->values()->all();
                });

            $usersMap = $userIds->isNotEmpty()
                ? User::query()->whereIn('id', $userIds)->get(['id', 'name', 'email'])->keyBy('id')
                : collect();

            $rows = $timesheets
                ->groupBy('user_id')
                ->map(function ($userTimesheets, $userKey) use ($entryTotals, $projectTotalsByUser, $usersMap, $projectId) {
                    $user = $usersMap->get($userKey);

                    $days = $userTimesheets
                        ->map(function ($timesheet) use ($entryTotals, $projectId) {
                            $entryTotal = $entryTotals->get($timesheet->id)->total_minutes ?? 0;
                            $total = (!$projectId && $entryTotal === 0 && $timesheet->total_minutes)
                                ? $timesheet->total_minutes
                                : (int) $entryTotal;

                            return [
                                'date' => $timesheet->work_date->toDateString(),
                                'total_minutes' => (int) $total,
                                'status' => $timesheet->status,
                                'submitted_at' => $timesheet->submitted_at,
                            ];
                        })
                        ->values()
                        ->all();

                    $totalMinutes = collect($days)->sum('total_minutes');

                    return [
                        'user' => $user
                            ? [
                                'id' => $user->id,
                                'name' => $user->name,
                                'email' => $user->email,
                            ]
                            : null,
                        'total_minutes' => $totalMinutes,
                        'days' => $days,
                        'projects' => $projectTotalsByUser->get($userKey, []),
                    ];
                })
                ->values()
                ->all();

            $sortableRows = $rows;
            if ($sort === 'name') {
                usort($sortableRows, function ($a, $b) use ($direction) {
                    $nameA = $a['user']['name'] ?? '';
                    $nameB = $b['user']['name'] ?? '';
                    return $direction === 'asc'
                        ? strcasecmp($nameA, $nameB)
                        : strcasecmp($nameB, $nameA);
                });
            } else {
                usort($sortableRows, function ($a, $b) use ($direction) {
                    return $direction === 'asc'
                        ? $a['total_minutes'] <=> $b['total_minutes']
                        : $b['total_minutes'] <=> $a['total_minutes'];
                });
            }

            $totalRows = count($sortableRows);
            $totalPages = (int) ceil($totalRows / $perPage);
            $page = min($page, max($totalPages, 1));
            $offset = ($page - 1) * $perPage;
            $pagedRows = array_slice($sortableRows, $offset, $perPage);

            $users = $user->is_admin
                ? User::query()->select('id', 'name', 'email')->orderBy('name')->get()
                : collect([$user->only(['id', 'name', 'email'])]);

            $projectsQuery = Project::query()->select('id', 'name')->where('is_active', true);
            if (!$user->is_admin) {
                $projectsQuery->whereHas('users', function ($projectUserQuery) use ($user) {
                    $projectUserQuery->where('users.id', $user->id);
                });
            }
            $projects = $projectsQuery->orderBy('name')->get();

            return [
                'rows' => $pagedRows,
                'sortableRows' => $sortableRows,
                'totalRows' => $totalRows,
                'totalPages' => $totalPages,
                'page' => $page,
                'users' => $users,
                'projects' => $projects,
            ];
        });

        $sortableRows = $payload['sortableRows'];
        $pagedRows = $payload['rows'];

        if ($request->query('format') === 'csv') {
            $csvLines = ['User,Email,Date,Status,Submitted At,Project,Total Minutes,Hours'];
            foreach ($sortableRows as $row) {
                foreach ($row['days'] as $day) {
                    $csvLines[] = sprintf(
                        '"%s","%s","%s","%s","%s","%s","%s","%s"',
                        $row['user']['name'] ?? 'Unknown',
                        $row['user']['email'] ?? '',
                        $day['date'],
                        $day['status'] ?? '',
                        $day['submitted_at'] ? (string) $day['submitted_at'] : '',
                        '',
                        $day['total_minutes'],
                        round($day['total_minutes'] / 60, 2)
                    );
                }

                foreach ($row['projects'] as $project) {
                    $csvLines[] = sprintf(
                        '"%s","%s","%s","%s","%s","%s","%s","%s"',
                        $row['user']['name'] ?? 'Unknown',
                        $row['user']['email'] ?? '',
                        '',
                        '',
                        '',
                        $project['name'],
                        $project['total_minutes'],
                        round($project['total_minutes'] / 60, 2)
                    );
                }
            }

            $totalMinutes = collect($sortableRows)->sum('total_minutes');
            $csvLines[] = sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s"',
                'Totals',
                '',
                '',
                '',
                '',
                '',
                $totalMinutes,
                round($totalMinutes / 60, 2)
            );

            $csv = implode("\n", $csvLines) . "\n";

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="report.csv"',
            ]);
        }

        return response()->json([
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'grouping' => 'user',
            'rows' => $pagedRows,
            'meta' => [
                'total_rows' => $payload['totalRows'],
                'page' => $payload['page'],
                'per_page' => $perPage,
                'total_pages' => $payload['totalPages'],
                'sort' => $sort,
                'direction' => $direction,
                'filters' => [
                    'status' => $status,
                    'include_drafts' => $includeDrafts,
                    'project_id' => $projectId ? (int) $projectId : null,
                    'user_id' => $userId ? (int) $userId : null,
                ],
                'users' => $payload['users'],
                'projects' => $payload['projects'],
            ],
        ]);
    }
}
