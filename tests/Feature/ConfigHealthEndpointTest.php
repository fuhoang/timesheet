<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConfigHealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_config_health_reports_ok_when_configuration_is_consistent(): void
    {
        config([
            'app.url' => 'http://127.0.0.1:8000',
            'endpoints.frontend_url' => 'http://127.0.0.1:5173',
            'cors.allowed_origins' => [
                'http://127.0.0.1:5173',
                'http://127.0.0.1:8000',
            ],
            'sanctum.stateful' => [
                '127.0.0.1:5173',
                '127.0.0.1:8000',
            ],
        ]);

        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/config/health')
            ->assertStatus(200)
            ->json();

        $this->assertTrue($response['ok']);
        $this->assertSame(0, $response['failed_count']);
    }

    public function test_admin_config_health_reports_issues_for_mismatched_hosts(): void
    {
        config([
            'app.url' => 'http://127.0.0.1:8000',
            'endpoints.frontend_url' => 'http://127.0.0.1:5173',
            'cors.allowed_origins' => [
                'http://localhost:5173',
            ],
            'sanctum.stateful' => [
                'localhost:5173',
            ],
        ]);

        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/config/health')
            ->assertStatus(200)
            ->json();

        $this->assertFalse($response['ok']);
        $this->assertGreaterThan(0, $response['failed_count']);

        $failedKeys = collect($response['checks'])
            ->filter(fn ($check) => !$check['ok'])
            ->pluck('key')
            ->all();

        $this->assertContains('cors_frontend', $failedKeys);
        $this->assertContains('sanctum_frontend', $failedKeys);
        $this->assertContains('host_format', $failedKeys);
    }

    public function test_non_admin_cannot_access_admin_config_health(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/config/health')
            ->assertStatus(403);
    }

    public function test_admin_config_health_handles_malformed_urls_without_500(): void
    {
        config([
            'app.url' => 'http://127.0.0.1:8000%%',
            'endpoints.frontend_url' => 'http://127.0.0.1:5173%%',
            'cors.allowed_origins' => ['http://127.0.0.1:5173'],
            'sanctum.stateful' => ['127.0.0.1:5173', '127.0.0.1:8000'],
        ]);

        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/config/health')
            ->assertStatus(200)
            ->json();

        $this->assertFalse($response['ok']);
    }
}
