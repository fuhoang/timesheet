<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use App\Models\TimesheetStatusHistory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class ConfigHealthController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $appUrl = (string) config('app.url', '');
        $frontendUrl = (string) config('endpoints.frontend_url', '');
        $corsOrigins = collect(config('cors.allowed_origins', []))
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values();
        $statefulDomains = collect(config('sanctum.stateful', []))
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values();

        $appHostPort = $this->toHostPort($appUrl);
        $frontendHostPort = $this->toHostPort($frontendUrl);

        $hasLocalhost = $this->containsHostVariant($corsOrigins, $statefulDomains, [$appUrl, $frontendUrl], 'localhost');
        $hasLoopback = $this->containsHostVariant($corsOrigins, $statefulDomains, [$appUrl, $frontendUrl], '127.0.0.1');

        $inProgressIssue = $this->inProgressWeekIssueStats();
        $historyPage = max((int) $request->query('history_page', 1), 1);
        $historyPerPage = min(max((int) $request->query('history_per_page', 10), 1), 50);
        $historyActor = trim((string) $request->query('history_actor', ''));
        $historyQuery = $this->fixHistoryQuery($historyActor);
        if ($request->query('history_format') === 'csv') {
            return $this->fixHistoryCsvResponse($historyQuery);
        }
        $history = $this->fixHistory($historyQuery, $historyPage, $historyPerPage);

        $checks = [
            $this->check(
                'app_url',
                'APP_URL is valid',
                filled($appHostPort),
                $appHostPort ? null : 'Set APP_URL with a full URL, e.g. http://127.0.0.1:8000'
            ),
            $this->check(
                'frontend_url',
                'FRONTEND_URL is valid',
                filled($frontendHostPort),
                $frontendHostPort ? null : 'Set FRONTEND_URL with a full URL, e.g. http://127.0.0.1:5173'
            ),
            $this->check(
                'cors_frontend',
                'CORS includes frontend URL',
                filled($frontendUrl) && $corsOrigins->contains($frontendUrl),
                "Add {$frontendUrl} to CORS_ALLOWED_ORIGINS"
            ),
            $this->check(
                'cors_backend',
                'CORS includes backend URL',
                filled($appUrl) && $corsOrigins->contains($appUrl),
                "Add {$appUrl} to CORS_ALLOWED_ORIGINS"
            ),
            $this->check(
                'sanctum_frontend',
                'Sanctum includes frontend host:port',
                filled($frontendHostPort) && $statefulDomains->contains($frontendHostPort),
                "Add {$frontendHostPort} to SANCTUM_STATEFUL_DOMAINS"
            ),
            $this->check(
                'sanctum_backend',
                'Sanctum includes backend host:port',
                filled($appHostPort) && $statefulDomains->contains($appHostPort),
                "Add {$appHostPort} to SANCTUM_STATEFUL_DOMAINS"
            ),
            $this->check(
                'host_format',
                'No localhost / 127.0.0.1 mixing',
                !($hasLocalhost && $hasLoopback),
                'Use one host format consistently across APP_URL, FRONTEND_URL, CORS_ALLOWED_ORIGINS, SANCTUM_STATEFUL_DOMAINS'
            ),
            $this->check(
                'in_progress_week_statuses',
                'In-progress week has no submitted/rejected/approved timesheets',
                $inProgressIssue['count'] === 0,
                $inProgressIssue['count'] === 0
                    ? null
                    : "Found {$inProgressIssue['count']} row(s). Use the one-click fix to reset them to draft."
            ),
        ];

        $checks = collect($checks)->map(function (array $check) use ($appUrl, $frontendUrl, $appHostPort, $frontendHostPort) {
            $check['copy_fix'] = $this->copyFixForCheck(
                $check['key'],
                $appUrl,
                $frontendUrl,
                $appHostPort,
                $frontendHostPort
            );
            return $check;
        })->values();

        $failed = $checks->where('ok', false)->values();

        return response()->json([
            'ok' => $failed->isEmpty(),
            'failed_count' => $failed->count(),
            'checks' => $checks,
            'values' => [
                'app_url' => $appUrl,
                'frontend_url' => $frontendUrl,
                'app_host_port' => $appHostPort,
                'frontend_host_port' => $frontendHostPort,
                'cors_allowed_origins' => $corsOrigins->all(),
                'sanctum_stateful_domains' => $statefulDomains->all(),
                'in_progress_week_status_count' => $inProgressIssue['count'],
                'in_progress_week_sample_ids' => $inProgressIssue['sample_ids'],
            ],
            'history' => $history,
        ]);
    }

    public function fixInProgressWeekStatuses(Request $request): JsonResponse
    {
        $user = $request->user();
        $weekStart = now()->startOfWeek()->toDateString();
        $weekEnd = now()->endOfWeek()->toDateString();

        $rows = Timesheet::query()
            ->whereBetween('work_date', [$weekStart, $weekEnd])
            ->whereIn('status', ['submitted', 'approved', 'rejected'])
            ->get();
        $isDryRun = filter_var($request->query('dry_run', false), FILTER_VALIDATE_BOOL);
        $sampleIds = $rows->pluck('id')->take(20)->values()->all();

        if ($isDryRun) {
            return response()->json([
                'status' => 'dry_run',
                'affected_count' => $rows->count(),
                'sample_ids' => $sampleIds,
            ]);
        }

        $data = $request->validate([
            'confirm' => 'required|accepted',
        ]);
        unset($data);

        $fixed = 0;
        foreach ($rows as $timesheet) {
            $fromStatus = $timesheet->status;
            $timesheet->update([
                'status' => 'draft',
                'submitted_at' => null,
                'approved_at' => null,
                'approved_by' => null,
                'rejection_reason' => null,
            ]);
            $timesheet->logStatusTransition($fromStatus, 'draft', $user, null, [
                'source' => 'admin_system_fix_in_progress_week',
            ]);
            $fixed++;
        }

        return response()->json([
            'status' => 'ok',
            'fixed_count' => $fixed,
            'sample_ids' => $sampleIds,
        ]);
    }

    private function check(string $key, string $label, bool $ok, ?string $hint = null): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'ok' => $ok,
            'hint' => $ok ? null : $hint,
        ];
    }

    private function toHostPort(string $urlOrHost): ?string
    {
        if ($urlOrHost === '') {
            return null;
        }

        $normalized = trim($urlOrHost);
        if ($normalized === '') {
            return null;
        }

        // Accept already-host:port values from SANCTUM_STATEFUL_DOMAINS style config.
        if (preg_match('/^[a-zA-Z0-9\.\-]+(:\d+)?$/', $normalized)) {
            return $normalized;
        }

        // Use @ to prevent malformed URL warnings from becoming 500 errors.
        $host = @parse_url($normalized, PHP_URL_HOST);
        $port = @parse_url($normalized, PHP_URL_PORT);

        if ($host) {
            return $port ? "{$host}:{$port}" : $host;
        }

        return null;
    }

    private function containsHostVariant($corsOrigins, $statefulDomains, array $urls, string $needle): bool
    {
        foreach ($urls as $url) {
            if (str_contains((string) $url, $needle)) {
                return true;
            }
        }

        if ($corsOrigins->contains(fn ($origin) => str_contains((string) $origin, $needle))) {
            return true;
        }

        return $statefulDomains->contains(fn ($domain) => str_contains((string) $domain, $needle));
    }

    private function copyFixForCheck(
        string $key,
        string $appUrl,
        string $frontendUrl,
        ?string $appHostPort,
        ?string $frontendHostPort
    ): ?string {
        return match ($key) {
            'app_url' => "APP_URL={$appUrl}",
            'frontend_url' => "FRONTEND_URL={$frontendUrl}",
            'cors_frontend', 'cors_backend' => "CORS_ALLOWED_ORIGINS={$frontendUrl},{$appUrl}",
            'sanctum_frontend', 'sanctum_backend' => "SANCTUM_STATEFUL_DOMAINS={$frontendHostPort},{$appHostPort}",
            'host_format' => 'Use one host style only (all localhost or all 127.0.0.1) across APP_URL, FRONTEND_URL, CORS_ALLOWED_ORIGINS, SANCTUM_STATEFUL_DOMAINS',
            'in_progress_week_statuses' => null,
            default => null,
        };
    }

    private function inProgressWeekIssueStats(): array
    {
        $weekStart = Carbon::now()->startOfWeek()->toDateString();
        $weekEnd = Carbon::now()->endOfWeek()->toDateString();

        $query = Timesheet::query()
            ->whereBetween('work_date', [$weekStart, $weekEnd])
            ->whereIn('status', ['submitted', 'approved', 'rejected']);

        return [
            'count' => (clone $query)->count(),
            'sample_ids' => $query->limit(10)->pluck('id')->all(),
        ];
    }

    private function fixHistoryQuery(string $actorFilter): Builder
    {
        $query = TimesheetStatusHistory::query()
            ->with([
                'actor:id,name,email',
                'timesheet:id,user_id,work_date',
                'timesheet.user:id,name,email',
            ])
            ->where('context->source', 'admin_system_fix_in_progress_week')
            ->orderByDesc('created_at');

        if ($actorFilter !== '') {
            $query->whereHas('actor', function ($actorQuery) use ($actorFilter) {
                $actorQuery
                    ->where('name', 'like', "%{$actorFilter}%")
                    ->orWhere('email', 'like', "%{$actorFilter}%");
            });
        }

        return $query;
    }

    private function fixHistory(Builder $query, int $page, int $perPage): array
    {
        $history = $query->paginate($perPage, ['*'], 'history_page', $page);

        return [
            'data' => collect($history->items())->map(function ($item) {
                return [
                    'id' => $item->id,
                    'created_at' => $item->created_at,
                    'actor' => $item->actor ? [
                        'id' => $item->actor->id,
                        'name' => $item->actor->name,
                        'email' => $item->actor->email,
                    ] : null,
                    'timesheet' => $item->timesheet ? [
                        'id' => $item->timesheet->id,
                        'work_date' => $item->timesheet->work_date,
                        'user' => $item->timesheet->user ? [
                            'id' => $item->timesheet->user->id,
                            'name' => $item->timesheet->user->name,
                            'email' => $item->timesheet->user->email,
                        ] : null,
                    ] : null,
                    'from_status' => $item->from_status,
                    'to_status' => $item->to_status,
                    'context' => $item->context,
                ];
            })->values()->all(),
            'current_page' => $history->currentPage(),
            'last_page' => $history->lastPage(),
            'per_page' => $history->perPage(),
            'total' => $history->total(),
        ];
    }

    private function fixHistoryCsvResponse(Builder $query): JsonResponse
    {
        $rows = $query->get();
        $lines = ['When,Admin,Admin Email,Timesheet ID,Work Date,User,User Email,From Status,To Status'];

        foreach ($rows as $row) {
            $lines[] = sprintf(
                '"%s","%s","%s","%s","%s","%s","%s","%s","%s"',
                (string) $row->created_at,
                $row->actor?->name ?? '',
                $row->actor?->email ?? '',
                (string) ($row->timesheet?->id ?? ''),
                (string) ($row->timesheet?->work_date ?? ''),
                $row->timesheet?->user?->name ?? '',
                $row->timesheet?->user?->email ?? '',
                (string) ($row->from_status ?? ''),
                (string) $row->to_status
            );
        }

        $csv = implode("\n", $lines) . "\n";
        return response()->json([], 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="in-progress-week-fix-history.csv"',
        ])->setContent($csv);
    }
}
