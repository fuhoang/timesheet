<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function reportsUrl(string $extraQuery = ''): string
    {
        $base = '/api/reports?start=2000-01-01&end=2100-01-01';

        return $extraQuery === '' ? $base : "{$base}&{$extraQuery}";
    }

    public function test_reports_restricts_non_admin_to_self(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Proj A',
            'description' => null,
            'is_active' => true,
        ]);
        $project->users()->attach($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 60,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'timesheet_id' => $timesheet->id,
            'project_id' => $project->id,
            'task_id' => null,
            'started_at' => now()->subHour(),
            'ended_at' => now(),
            'duration_minutes' => 60,
            'description' => 'Work',
        ]);

        $otherTimesheet = Timesheet::create([
            'user_id' => $other->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        TimeEntry::create([
            'user_id' => $other->id,
            'timesheet_id' => $otherTimesheet->id,
            'project_id' => $project->id,
            'task_id' => null,
            'started_at' => now()->subMinutes(30),
            'ended_at' => now(),
            'duration_minutes' => 30,
            'description' => 'Other work',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson($this->reportsUrl())
            ->assertStatus(200)
            ->json();

        $this->assertCount(1, $response['rows']);
        $this->assertSame($user->id, $response['rows'][0]['user']['id']);
    }

    public function test_reports_supports_filters_for_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        $projectA = Project::create([
            'user_id' => $user->id,
            'name' => 'Alpha',
            'description' => null,
            'is_active' => true,
        ]);
        $projectB = Project::create([
            'user_id' => $user->id,
            'name' => 'Beta',
            'description' => null,
            'is_active' => true,
        ]);
        $projectA->users()->attach($user);
        $projectB->users()->attach($user);

        $approved = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 90,
            'status' => 'approved',
            'submitted_at' => now(),
            'approved_at' => now(),
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'timesheet_id' => $approved->id,
            'project_id' => $projectA->id,
            'task_id' => null,
            'started_at' => now()->subMinutes(60),
            'ended_at' => now(),
            'duration_minutes' => 60,
            'description' => 'Alpha work',
        ]);

        TimeEntry::create([
            'user_id' => $user->id,
            'timesheet_id' => $approved->id,
            'project_id' => $projectB->id,
            'task_id' => null,
            'started_at' => now()->subMinutes(30),
            'ended_at' => now(),
            'duration_minutes' => 30,
            'description' => 'Beta work',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('status=approved&project_id=' . $projectA->id . '&user_id=' . $user->id))
            ->assertStatus(200)
            ->json();

        $this->assertCount(1, $response['rows']);
        $this->assertSame($user->id, $response['rows'][0]['user']['id']);
        $this->assertSame('approved', $response['meta']['filters']['status']);
        $this->assertSame($projectA->id, $response['meta']['filters']['project_id']);
        $this->assertSame($user->id, $response['meta']['filters']['user_id']);
    }

    public function test_reports_default_excludes_drafts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'draft',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl())
            ->assertStatus(200)
            ->json();

        $this->assertSame(false, $response['meta']['filters']['include_drafts']);
    }

    public function test_reports_default_includes_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 45,
            'status' => 'rejected',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl())
            ->assertStatus(200)
            ->json();

        $this->assertCount(1, $response['rows']);
        $this->assertSame($user->id, $response['rows'][0]['user']['id']);
    }

    public function test_reports_include_drafts_toggle(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'draft',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('include_drafts=1'))
            ->assertStatus(200)
            ->json();

        $this->assertSame(true, $response['meta']['filters']['include_drafts']);
    }

    public function test_reports_status_filter_overrides_include_drafts(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'approved',
            'submitted_at' => now(),
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('status=approved&include_drafts=1'))
            ->assertStatus(200)
            ->json();

        $this->assertSame('approved', $response['meta']['filters']['status']);
        $this->assertSame(true, $response['meta']['filters']['include_drafts']);
        $this->assertCount(1, $response['rows']);
    }

    public function test_reports_status_all_includes_drafts_and_submitted(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $draftUser = User::factory()->create();
        $submittedUser = User::factory()->create();

        Timesheet::create([
            'user_id' => $draftUser->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'draft',
        ]);

        Timesheet::create([
            'user_id' => $submittedUser->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 60,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('status=all'))
            ->assertStatus(200)
            ->json();

        $this->assertSame('all', $response['meta']['filters']['status']);
        $this->assertCount(2, $response['rows']);
    }

    public function test_reports_status_all_ignores_include_drafts_toggle(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 25,
            'status' => 'draft',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('status=all&include_drafts=0'))
            ->assertStatus(200)
            ->json();

        $this->assertCount(1, $response['rows']);
        $this->assertSame('all', $response['meta']['filters']['status']);
    }

    public function test_reports_returns_total_minutes_all(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 120,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl())
            ->assertStatus(200)
            ->json();

        $this->assertSame(120, $response['meta']['total_minutes_all']);
    }

    public function test_reports_profile_mode_returns_profile_meta(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 60,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson($this->reportsUrl('profile=1'))
            ->assertStatus(200)
            ->json();

        $this->assertArrayHasKey('profile', $response['meta']);
        $this->assertArrayHasKey('request_id', $response['meta']['profile']);
        $this->assertArrayHasKey('timings_ms', $response['meta']['profile']);
        $this->assertArrayHasKey('build_payload_ms', $response['meta']['profile']['timings_ms']);
    }
}
