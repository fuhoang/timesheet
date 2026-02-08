<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $startParam = $request->query('start');
        $endParam = $request->query('end');
        $status = $request->query('status');
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
            $projectId,
            $userId,
            $sort,
            $direction,
            $page,
            $perPage
        ) {
            $query = Timesheet::with([
                'user:id,name,email',
                'entries' => function ($entryQuery) use ($projectId) {
                    $entryQuery->select('id', 'timesheet_id', 'duration_minutes', 'project_id');
                    if ($projectId) {
                        $entryQuery->where('project_id', $projectId);
                    }
                },
            ])
                ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()]);

            if (!$user->is_admin) {
                $query->where('user_id', $user->id);
            } elseif ($userId) {
                $query->where('user_id', $userId);
            }

            if ($status && in_array($status, ['draft', 'submitted', 'approved', 'rejected'], true)) {
                $query->where('status', $status);
            }

            if ($projectId) {
                $query->whereHas('entries', function ($entryQuery) use ($projectId) {
                    $entryQuery->where('project_id', $projectId);
                });
            }

            $timesheets = $query->get();

            $projectIds = $timesheets
                ->flatMap(fn ($timesheet) => $timesheet->entries)
                ->pluck('project_id')
                ->filter()
                ->unique()
                ->values();

            $projectNames = $projectIds->isNotEmpty()
                ? Project::query()->whereIn('id', $projectIds)->pluck('name', 'id')
                : collect();

            $rows = $timesheets
                ->groupBy('user_id')
                ->map(function ($userTimesheets) use ($projectId, $projectNames) {
                    $user = $userTimesheets->first()->user;

                    $projectTotals = $userTimesheets
                        ->flatMap(fn ($timesheet) => $timesheet->entries)
                        ->groupBy('project_id')
                        ->map(function ($entries, $entryProjectId) use ($projectNames) {
                            $totalMinutes = $entries->sum('duration_minutes');
                            return [
                                'id' => $entryProjectId ? (int) $entryProjectId : null,
                                'name' => $entryProjectId
                                    ? ($projectNames[$entryProjectId] ?? 'Unknown project')
                                    : 'No project',
                                'total_minutes' => $totalMinutes,
                            ];
                        })
                        ->values()
                        ->all();

                    $days = $userTimesheets
                        ->groupBy(fn ($timesheet) => $timesheet->work_date->toDateString())
                        ->map(function ($dayTimesheets) use ($projectId) {
                            $total = $dayTimesheets->sum(function ($timesheet) use ($projectId) {
                                $entryTotal = $timesheet->entries->sum('duration_minutes');
                                if (!$projectId && $entryTotal === 0 && $timesheet->total_minutes) {
                                    return $timesheet->total_minutes;
                                }
                                return $entryTotal;
                            });

                            return [
                                'date' => $dayTimesheets->first()->work_date->toDateString(),
                                'total_minutes' => $total,
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
                        'projects' => $projectTotals,
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
            $csvLines = ['User,Email,Date,Project,Total Minutes,Hours'];
            foreach ($sortableRows as $row) {
                foreach ($row['days'] as $day) {
                    $csvLines[] = sprintf(
                        '"%s","%s","%s","%s","%s","%s"',
                        $row['user']['name'] ?? 'Unknown',
                        $row['user']['email'] ?? '',
                        $day['date'],
                        '',
                        $day['total_minutes'],
                        round($day['total_minutes'] / 60, 2)
                    );
                }

                foreach ($row['projects'] as $project) {
                    $csvLines[] = sprintf(
                        '"%s","%s","%s","%s","%s","%s"',
                        $row['user']['name'] ?? 'Unknown',
                        $row['user']['email'] ?? '',
                        '',
                        $project['name'],
                        $project['total_minutes'],
                        round($project['total_minutes'] / 60, 2)
                    );
                }
            }

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
                    'project_id' => $projectId ? (int) $projectId : null,
                    'user_id' => $userId ? (int) $userId : null,
                ],
                'users' => $payload['users'],
                'projects' => $payload['projects'],
            ],
        ]);
    }
}
