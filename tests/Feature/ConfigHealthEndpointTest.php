<?php

namespace Tests\Feature;

use App\Models\AdminSystemOperationLog;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
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
        $this->assertArrayHasKey('values', $response);
        $this->assertArrayHasKey('app_url', $response['values']);
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
        $firstFailed = collect($response['checks'])->first(fn ($check) => !$check['ok']);
        $this->assertNotEmpty($firstFailed['copy_fix'] ?? null);
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

    public function test_admin_config_health_detects_in_progress_week_status_issues(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $response = $this->getJson('/api/admin/config/health')
            ->assertStatus(200)
            ->json();

        $issueCheck = collect($response['checks'])->firstWhere('key', 'in_progress_week_statuses');
        $this->assertNotNull($issueCheck);
        $this->assertFalse($issueCheck['ok']);
        $this->assertGreaterThan(0, $response['values']['in_progress_week_status_count']);
        Carbon::setTestNow();
    }

    public function test_admin_can_fix_in_progress_week_status_issues(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'rejected',
            'submitted_at' => now(),
            'rejection_reason' => 'Needs update',
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week', ['confirm' => true])
            ->assertStatus(200)
            ->assertJson(['status' => 'ok', 'fixed_count' => 1]);

        $timesheet->refresh();
        $this->assertSame('draft', $timesheet->status);
        $this->assertNull($timesheet->submitted_at);
        $this->assertNull($timesheet->rejection_reason);
        Carbon::setTestNow();
    }

    public function test_admin_dry_run_fix_reports_count_without_mutation(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week?dry_run=1')
            ->assertStatus(200)
            ->assertJson(['status' => 'dry_run', 'affected_count' => 1]);

        $timesheet->refresh();
        $this->assertSame('submitted', $timesheet->status);
        $this->assertNotNull($timesheet->submitted_at);
        Carbon::setTestNow();
    }

    public function test_admin_config_health_includes_fix_history_with_filters(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true, 'name' => 'Fix Admin']);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'rejected',
            'submitted_at' => now(),
            'rejection_reason' => 'Needs update',
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week', ['confirm' => true])
            ->assertStatus(200);

        $response = $this->getJson('/api/admin/config/health?history_page=1&history_per_page=10&history_actor=Fix')
            ->assertStatus(200)
            ->json();

        $this->assertArrayHasKey('history', $response);
        $this->assertNotEmpty($response['history']['data']);
        $this->assertSame('Fix Admin', $response['history']['data'][0]['actor']['name']);
        Carbon::setTestNow();
    }

    public function test_non_admin_cannot_fix_in_progress_week_status_issues(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $this->postJson('/api/admin/config/fix-in-progress-week')
            ->assertStatus(403);
    }

    public function test_admin_fix_requires_confirmation_payload(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['confirm']);
        Carbon::setTestNow();
    }

    public function test_admin_config_health_history_pagination_bounds_are_clamped(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'rejected',
            'submitted_at' => now(),
            'rejection_reason' => 'Needs update',
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week', ['confirm' => true])
            ->assertStatus(200);

        $response = $this->getJson('/api/admin/config/health?history_page=0&history_per_page=999')
            ->assertStatus(200)
            ->json();

        $this->assertSame(1, $response['history']['current_page']);
        $this->assertSame(50, $response['history']['per_page']);
        Carbon::setTestNow();
    }

    public function test_admin_can_export_fix_history_csv(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true, 'name' => 'Csv Admin']);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week', ['confirm' => true])
            ->assertStatus(200);

        $response = $this->get('/api/admin/config/health?history_format=csv');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString('Csv Admin', $response->getContent());
        Carbon::setTestNow();
    }

    public function test_fix_operations_are_logged_for_dry_run_and_apply(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 45,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/config/fix-in-progress-week?dry_run=1')
            ->assertStatus(200);
        $this->postJson('/api/admin/config/fix-in-progress-week', ['confirm' => true])
            ->assertStatus(200);

        $logs = AdminSystemOperationLog::query()
            ->where('action', 'fix_in_progress_week_statuses')
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $logs);
        $this->assertTrue($logs[0]->dry_run);
        $this->assertFalse($logs[1]->dry_run);
        $this->assertNotEmpty($logs[0]->request_id);
        $this->assertNotEmpty($logs[1]->request_id);
        Carbon::setTestNow();
    }

    public function test_fix_endpoint_is_rate_limited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/admin/config/fix-in-progress-week?dry_run=1')
                ->assertStatus(200);
        }

        $this->postJson('/api/admin/config/fix-in-progress-week?dry_run=1')
            ->assertStatus(429);
    }
}
