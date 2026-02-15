<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ConfigHealthController extends Controller
{
    public function index(): JsonResponse
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
        ];

        $failed = collect($checks)->where('ok', false)->values();

        return response()->json([
            'ok' => $failed->isEmpty(),
            'failed_count' => $failed->count(),
            'checks' => $checks,
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
}
