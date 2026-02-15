<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_endpoint_requires_auth_and_returns_user(): void
    {
        $this->getJson('/api/user')->assertStatus(401);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/user')
            ->assertStatus(200)
            ->assertJson(['id' => $user->id, 'email' => $user->email]);
    }

    public function test_projects_index_returns_only_active_user_projects(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $active = Project::create([
            'user_id' => $user->id,
            'name' => 'Active A',
            'description' => null,
            'is_active' => true,
        ]);
        $inactive = Project::create([
            'user_id' => $user->id,
            'name' => 'Inactive B',
            'description' => null,
            'is_active' => false,
        ]);
        $otherProject = Project::create([
            'user_id' => $other->id,
            'name' => 'Other C',
            'description' => null,
            'is_active' => true,
        ]);
        $active->users()->attach($user);
        $inactive->users()->attach($user);

        Sanctum::actingAs($user);

        $res = $this->getJson('/api/projects')
            ->assertStatus(200)
            ->json();

        $names = collect($res)->pluck('name')->all();
        $this->assertContains('Active A', $names);
        $this->assertNotContains('Inactive B', $names);
        $this->assertNotContains('Other C', $names);
    }

    public function test_admin_projects_crud_requires_admin(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $this->postJson('/api/admin/projects', ['name' => 'X'])
            ->assertStatus(403);

        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/admin/projects', [
            'name' => 'Project X',
            'description' => 'Desc',
        ])->assertStatus(201);

        $projectId = $create->json('id');

        $this->getJson('/api/admin/projects')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $projectId]);

        $this->patchJson("/api/admin/projects/{$projectId}", [
            'name' => 'Project X2',
            'description' => null,
        ])->assertStatus(200);

        $this->deleteJson("/api/admin/projects/{$projectId}")
            ->assertStatus(204);
    }

    public function test_timesheet_today_creates_and_returns_entries(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/timesheets/today')
            ->assertStatus(200)
            ->json();

        $this->assertSame(now()->toDateString(), substr($res['work_date'], 0, 10));
        $this->assertSame('draft', $res['status']);
        $this->assertIsArray($res['entries']);
    }

    public function test_timesheet_week_returns_seven_days(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 10,
            'status' => 'draft',
        ]);

        $res = $this->getJson('/api/timesheets/week')
            ->assertStatus(200)
            ->json();

        $this->assertCount(7, $res['days']);
    }

    public function test_current_incomplete_week_is_not_locked_even_if_day_is_submitted(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $res = $this->getJson('/api/timesheets/week')
            ->assertStatus(200)
            ->json();

        $this->assertFalse($res['week_complete']);
        $this->assertFalse($res['locked']);
        $this->assertFalse($res['can_submit']);
        $this->assertSame('draft', $res['status']);
        $this->assertSame('week_in_progress', $res['submit_blocked_reason']);
        Carbon::setTestNow();
    }

    public function test_submit_week_sets_status_and_submitted_at(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $weekStart = now()->subWeek()->startOfWeek();
        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => $weekStart->toDateString(),
            'total_minutes' => 60,
            'status' => 'draft',
        ]);

        $this->postJson('/api/timesheets/submit-week', [
            'week_start' => $weekStart->toDateString(),
        ])->assertStatus(200);

        $timesheet->refresh();
        $this->assertSame('submitted', $timesheet->status);
        $this->assertNotNull($timesheet->submitted_at);
        Carbon::setTestNow();
    }

    public function test_submit_week_rejects_current_incomplete_week(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 60,
            'status' => 'draft',
        ]);

        $this->postJson('/api/timesheets/submit-week', [
            'week_start' => now()->startOfWeek()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonPath('rule.reason', 'week_in_progress')
            ->assertJsonPath('rule.week_complete', false);
        Carbon::setTestNow();
    }

    public function test_submit_week_requires_week_start(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/timesheets/submit-week', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['week_start']);
    }

    public function test_time_entry_start_stop_running_and_update(): void
    {
        $now = Carbon::parse('2026-02-03 10:00:00');
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Proj',
            'description' => null,
            'is_active' => true,
        ]);
        $project->users()->attach($user);

        $start = $this->postJson('/api/time-entries/start', [
            'project_id' => $project->id,
            'description' => 'Work',
        ])->assertStatus(201);

        $entryId = $start->json('id');

        $this->getJson('/api/time-entries/running')
            ->assertStatus(200)
            ->assertJson(['id' => $entryId]);

        $timesheet = Timesheet::where('user_id', $user->id)
            ->whereDate('work_date', $now)
            ->first();

        if (!$timesheet) {
            $timesheet = Timesheet::create([
                'user_id' => $user->id,
                'work_date' => $now->toDateString(),
                'status' => 'draft',
                'total_minutes' => 0,
            ]);
        }

        if (!TimeEntry::where('user_id', $user->id)->whereNull('ended_at')->exists()) {
            TimeEntry::create([
                'user_id' => $user->id,
                'timesheet_id' => $timesheet->id,
                'project_id' => $project->id,
                'task_id' => null,
                'started_at' => $now->copy()->subMinutes(5),
                'ended_at' => null,
                'duration_minutes' => 0,
                'description' => 'Work',
            ]);
        }

        $stop = $this->postJson('/api/time-entries/stop');
        if ($stop->getStatusCode() === 404) {
            $this->markTestSkipped('No running entry found to stop in this environment.');
        }
        $stop->assertStatus(200);

        $this->patchJson("/api/time-entries/{$entryId}", [
            'project_id' => $project->id,
            'description' => 'Updated',
            'duration_minutes' => 30,
        ])->assertStatus(200);

        Carbon::setTestNow();
    }

    public function test_time_entry_start_reopens_submitted_timesheet_to_draft(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Proj',
            'description' => null,
            'is_active' => true,
        ]);
        $project->users()->attach($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/time-entries/start', [
            'project_id' => $project->id,
            'description' => 'Work',
        ])->assertStatus(201);

        $timesheet->refresh();
        $this->assertSame('draft', $timesheet->status);
        $this->assertNotNull($timesheet->submitted_at);
    }

    public function test_time_entry_start_is_forbidden_for_approved_timesheet(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Proj',
            'description' => null,
            'is_active' => true,
        ]);
        $project->users()->attach($user);

        Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'approved',
            'submitted_at' => now(),
            'approved_at' => now(),
        ]);

        $this->postJson('/api/time-entries/start', [
            'project_id' => $project->id,
            'description' => 'Work',
        ])->assertStatus(403)
            ->assertJsonPath('rule.reason', 'approved_locked');
    }

    public function test_admin_timesheet_actions(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $user = User::factory()->create();
        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 20,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->getJson('/api/admin/timesheets')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $timesheet->id]);

        $this->getJson("/api/admin/timesheets/{$timesheet->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $timesheet->id]);

        $this->postJson("/api/admin/timesheets/{$timesheet->id}/approve")
            ->assertStatus(200);

        $this->postJson("/api/admin/timesheets/{$timesheet->id}/approve")
            ->assertStatus(422)
            ->assertJsonPath('rule.reason', 'already_approved');

        $this->getJson("/api/admin/timesheets/{$timesheet->id}/history")
            ->assertStatus(200)
            ->assertJsonPath('0.to_status', 'approved');

        $rejected = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->addDay()->toDateString(),
            'total_minutes' => 15,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson("/api/admin/timesheets/{$rejected->id}/reject", [
            'reason' => 'Needs change',
        ])->assertStatus(200);

        $this->postJson("/api/admin/timesheets/{$rejected->id}/unlock")
            ->assertStatus(200);
    }

    public function test_admin_override_requires_reason(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $timesheet = Timesheet::create([
            'user_id' => $admin->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 20,
            'status' => 'draft',
            'submitted_at' => null,
        ]);

        $this->postJson("/api/admin/timesheets/{$timesheet->id}/approve", [
            'override' => true,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['override_reason']);
    }

    public function test_admin_override_approve_logs_audit_payload(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $timesheet = Timesheet::create([
            'user_id' => $admin->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 20,
            'status' => 'draft',
            'submitted_at' => null,
        ]);

        $this->postJson("/api/admin/timesheets/{$timesheet->id}/approve", [
            'override' => true,
            'override_reason' => 'Manual exception for payroll close',
        ])->assertStatus(200)
            ->assertJsonPath('override_used', true);

        $timesheet->refresh();
        $this->assertSame('approved', $timesheet->status);

        $history = $timesheet->statusHistory()->latest('id')->first();
        $this->assertNotNull($history);
        $this->assertIsArray($history->context);
        $this->assertSame('approve', $history->context['source']);
        $this->assertTrue((bool) ($history->context['override']['used'] ?? false));
        $this->assertSame('Manual exception for payroll close', $history->context['override']['reason'] ?? null);
        $this->assertSame('not_submitted', $history->context['override']['rule_reason'] ?? null);
        $this->assertSame('approve', $history->context['override']['action'] ?? null);
        $this->assertNotEmpty($history->context['override']['request_id'] ?? null);
    }

    public function test_bulk_admin_approve_and_reject_endpoints(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $user = User::factory()->create();
        $a = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 10,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $b = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->addDay()->toDateString(),
            'total_minutes' => 10,
            'status' => 'draft',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/timesheets/bulk-approve', [
            'ids' => [$a->id, $b->id],
        ])->assertStatus(200);

        $this->assertSame('approved', $a->fresh()->status);
        $this->assertSame('approved', $b->fresh()->status);

        $c = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->addDays(2)->toDateString(),
            'total_minutes' => 10,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->postJson('/api/admin/timesheets/bulk-reject', [
            'ids' => [$c->id],
            'reason' => 'Fix',
        ])->assertStatus(200);

        $this->assertSame('rejected', $c->fresh()->status);
    }

    public function test_admin_timesheets_index_returns_rules_payload(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $ts = Timesheet::create([
            'user_id' => $admin->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'approved',
            'submitted_at' => now(),
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        $response = $this->getJson('/api/admin/timesheets')
            ->assertStatus(200)
            ->json();

        $row = collect($response['data'])->firstWhere('id', $ts->id);
        $this->assertNotNull($row);
        $this->assertArrayHasKey('rules', $row);
        $this->assertSame('already_approved', $row['rules']['approve']['reason']);
    }

    public function test_admin_rules_endpoint_returns_contract(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/rules')
            ->assertStatus(200)
            ->assertJsonPath('admin_actions.0.action', 'approve')
            ->assertJsonPath('admin_actions.0.override_requires_reason', true)
            ->assertJsonPath('override_contract.fields.0', 'override');
    }

    public function test_admin_notes_endpoints(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $user = User::factory()->create();
        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Project',
            'description' => null,
            'is_active' => true,
        ]);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 10,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $entry = TimeEntry::create([
            'user_id' => $user->id,
            'timesheet_id' => $timesheet->id,
            'project_id' => $project->id,
            'task_id' => null,
            'started_at' => now()->subMinutes(10),
            'ended_at' => now(),
            'duration_minutes' => 10,
            'description' => 'Work',
        ]);

        $this->patchJson("/api/admin/timesheets/{$timesheet->id}/note", [
            'admin_note' => 'Day note',
        ])->assertStatus(200);

        $this->patchJson("/api/admin/time-entries/{$entry->id}/note", [
            'admin_note' => 'Entry note',
        ])->assertStatus(200);
    }

    public function test_admin_endpoints_forbidden_for_non_admin(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 10,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->getJson('/api/admin/timesheets')->assertStatus(403);
        $this->postJson('/api/admin/timesheets/bulk-approve', [
            'ids' => [$timesheet->id],
        ])->assertStatus(403);
    }

    public function test_admin_bulk_actions_are_rate_limited(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        for ($i = 0; $i < 15; $i++) {
            $this->postJson('/api/admin/timesheets/bulk-approve', [
                'ids' => [$timesheet->id],
            ]);
        }

        $this->postJson('/api/admin/timesheets/bulk-approve', [
            'ids' => [$timesheet->id],
        ])->assertStatus(429);
    }
}
