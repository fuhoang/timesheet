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
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $startParam = $request->query('start');
        $endParam = $request->query('end');
        $rawStatus = strtolower(trim((string) $request->query('status', '')));
        $isAllStatuses = $rawStatus === 'all';
        $status = in_array($rawStatus, ['draft', 'submitted', 'approved', 'rejected'], true)
            ? $rawStatus
            : null;
        $includeDrafts = filter_var($request->query('include_drafts', false), FILTER_VALIDATE_BOOL);
        if ($isAllStatuses) {
            $includeDrafts = true;
        }
        $projectId = $request->query('project_id');
        $userId = $request->query('user_id');
        $sort = $request->query('sort', 'total_minutes');
        if (!in_array($sort, ['total_minutes', 'name'], true)) {
            $sort = 'total_minutes';
        }
        $direction = strtolower($request->query('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $profile = filter_var($request->query('profile', false), FILTER_VALIDATE_BOOL);
        $timings = [];
        $stepStartedAt = microtime(true);

        $start = $startParam
            ? Carbon::parse($startParam)->startOfDay()
            : now()->startOfWeek();
        $end = $endParam
            ? Carbon::parse($endParam)->endOfDay()
            : now()->endOfWeek();

        if ($start->gt($end)) {
            [$start, $end] = [$end, $start];
        }

        $exportAll = $request->query('format') === 'csv';

        $cacheKey = 'reports:' . $user->id . ':' . md5(json_encode([
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'status' => $rawStatus ?: null,
            'include_drafts' => $includeDrafts,
            'project_id' => $projectId,
            'user_id' => $userId,
            'sort' => $sort,
            'direction' => $direction,
            'page' => $page,
            'per_page' => $perPage,
            'is_admin' => (bool) $user->is_admin,
            'export' => $exportAll,
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
            $perPage,
            $exportAll
        ) {
            $applyTimesheetFilters = function ($query) use (
                $user,
                $start,
                $end,
                $status,
                $includeDrafts,
                $projectId,
                $userId
            ) {
                $query->whereBetween('timesheets.work_date', [$start->toDateString(), $end->toDateString()]);

                if ($projectId) {
                    $query->whereExists(function ($sub) use ($projectId) {
                        $sub->select(DB::raw(1))
                            ->from('time_entries')
                            ->whereColumn('time_entries.timesheet_id', 'timesheets.id')
                            ->where('time_entries.project_id', $projectId);
                    });
                }

                if (!$user->is_admin) {
                    $query->where('timesheets.user_id', $user->id);
                } elseif ($userId) {
                    $query->where('timesheets.user_id', $userId);
                }

                if ($status) {
                    $query->where('timesheets.status', $status);
                } elseif (!$includeDrafts) {
                    $query->whereIn('timesheets.status', ['submitted', 'approved', 'rejected']);
                }
            };

            $entryTotalsSub = TimeEntry::query()
                ->select('timesheet_id', DB::raw('SUM(duration_minutes) as entry_minutes'))
                ->when($projectId, fn ($entryQuery) => $entryQuery->where('project_id', $projectId))
                ->groupBy('timesheet_id');

            $userTotalsQuery = Timesheet::query()
                ->select(
                    'timesheets.user_id',
                    'users.name as user_name',
                    'users.email as user_email',
                    DB::raw('SUM(CASE WHEN COALESCE(entry_totals.entry_minutes, 0) = 0 THEN timesheets.total_minutes ELSE entry_totals.entry_minutes END) as total_minutes')
                )
                ->join('users', 'users.id', '=', 'timesheets.user_id')
                ->leftJoinSub($entryTotalsSub, 'entry_totals', function ($join) {
                    $join->on('entry_totals.timesheet_id', '=', 'timesheets.id');
                })
                ->tap($applyTimesheetFilters)
                ->groupBy('timesheets.user_id', 'users.name', 'users.email');

            if ($sort === 'name') {
                $userTotalsQuery->orderBy('users.name', $direction);
            } else {
                $userTotalsQuery->orderBy('total_minutes', $direction);
            }

            $totalRows = DB::query()->fromSub($userTotalsQuery, 'user_totals')->count();
            $totalPages = (int) ceil($totalRows / $perPage);
            $page = $exportAll ? 1 : min($page, max($totalPages, 1));

            $userTotalsForTotals = clone $userTotalsQuery;

            $pagedUserTotals = $exportAll
                ? $userTotalsQuery->get()
                : $userTotalsQuery->forPage($page, $perPage)->get();

            $pagedUserIds = $pagedUserTotals->pluck('user_id');

            $timesheets = $pagedUserIds->isNotEmpty()
                ? Timesheet::query()
                    ->select(
                        'timesheets.id',
                        'timesheets.user_id',
                        'timesheets.work_date',
                        'timesheets.total_minutes',
                        'timesheets.status',
                        'timesheets.submitted_at',
                        DB::raw('COALESCE(entry_totals.entry_minutes, 0) as entry_minutes')
                    )
                    ->leftJoinSub($entryTotalsSub, 'entry_totals', function ($join) {
                        $join->on('entry_totals.timesheet_id', '=', 'timesheets.id');
                    })
                    ->tap($applyTimesheetFilters)
                    ->whereIn('timesheets.user_id', $pagedUserIds)
                    ->orderBy('timesheets.work_date')
                    ->get()
                : collect();

            $projectTotalsRaw = $pagedUserIds->isNotEmpty()
                ? TimeEntry::query()
                    ->select('timesheets.user_id', 'time_entries.project_id', DB::raw('SUM(time_entries.duration_minutes) as total_minutes'))
                    ->join('timesheets', 'timesheets.id', '=', 'time_entries.timesheet_id')
                    ->when($projectId, fn ($entryQuery) => $entryQuery->where('time_entries.project_id', $projectId))
                    ->whereIn('timesheets.user_id', $pagedUserIds)
                    ->whereBetween('timesheets.work_date', [$start->toDateString(), $end->toDateString()])
                    ->when($status, function ($entryQuery) use ($status) {
                        $entryQuery->where('timesheets.status', $status);
                    })
                    ->when(!$status && !$includeDrafts, function ($entryQuery) {
                        $entryQuery->whereIn('timesheets.status', ['submitted', 'approved', 'rejected']);
                    })
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

            $rows = $pagedUserTotals->map(function ($userRow) use ($timesheets, $projectTotalsByUser, $projectId) {
                $userTimesheets = $timesheets->where('user_id', $userRow->user_id);
                $days = $userTimesheets
                    ->map(function ($timesheet) use ($projectId) {
                        $entryTotal = (int) $timesheet->entry_minutes;
                        $total = $projectId
                            ? $entryTotal
                            : (($entryTotal === 0 && $timesheet->total_minutes)
                                ? (int) $timesheet->total_minutes
                                : $entryTotal);

                        return [
                            'date' => $timesheet->work_date->toDateString(),
                            'total_minutes' => $total,
                            'status' => $timesheet->status,
                            'submitted_at' => $timesheet->submitted_at,
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'user' => [
                        'id' => $userRow->user_id,
                        'name' => $userRow->user_name,
                        'email' => $userRow->user_email,
                    ],
                    'total_minutes' => (int) $userRow->total_minutes,
                    'days' => $days,
                    'projects' => $projectTotalsByUser->get($userRow->user_id, []),
                ];
            })->values()->all();

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
                'rows' => $rows,
                'totalRows' => $totalRows,
                'totalPages' => $totalPages,
                'page' => $page,
                'totalMinutesAll' => $totalRows > 0
                    ? DB::query()->fromSub($userTotalsForTotals, 'user_totals')->sum('total_minutes')
                    : 0,
                'users' => $users,
                'projects' => $projects,
            ];
        });
        $timings['build_payload_ms'] = (int) round((microtime(true) - $stepStartedAt) * 1000);

        $pagedRows = $payload['rows'];
        $totalMinutesAll = (int) ($payload['totalMinutesAll'] ?? 0);

        if ($request->query('format') === 'csv') {
            $csvLines = ['User,Email,Date,Status,Submitted At,Project,Total Minutes,Hours'];
            foreach ($pagedRows as $row) {
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

                $csvLines[] = sprintf(
                    '"%s","%s","%s","%s","%s","%s","%s","%s"',
                    $row['user']['name'] ?? 'Unknown',
                    $row['user']['email'] ?? '',
                    '',
                    'total',
                    '',
                    '',
                    $row['total_minutes'],
                    round($row['total_minutes'] / 60, 2)
                );
            }

            $csvLines[] = sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s"',
                'Totals',
                '',
                '',
                '',
                '',
                '',
                $totalMinutesAll,
                round($totalMinutesAll / 60, 2)
            );

            $csv = implode("\n", $csvLines) . "\n";

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="report.csv"',
            ]);
        }

        $response = [
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
                    'status' => $isAllStatuses ? 'all' : ($status ?: null),
                    'include_drafts' => $includeDrafts,
                    'project_id' => $projectId ? (int) $projectId : null,
                    'user_id' => $userId ? (int) $userId : null,
                ],
                'total_minutes_all' => $totalMinutesAll,
                'users' => $payload['users'],
                'projects' => $payload['projects'],
            ],
        ];

        if ($profile) {
            $response['meta']['profile'] = [
                'request_id' => (string) Str::uuid(),
                'timings_ms' => $timings,
                'cache_ttl_seconds' => 300,
            ];
        }

        return response()->json($response);
    }
}
