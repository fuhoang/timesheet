<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TimesheetFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_submit_week_sets_status_submitted(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 60,
            'status' => 'draft',
        ]);

        $response = $this->postJson('/api/timesheets/submit-week', [
            'week_start' => now()->startOfWeek()->toDateString(),
        ]);

        $response->assertStatus(200);

        $timesheet->refresh();
        $this->assertSame('submitted', $timesheet->status);
        $this->assertNotNull($timesheet->submitted_at);
    }

    public function test_rejected_edit_keeps_submitted_at_and_resets_rejection(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Project A',
            'description' => null,
            'is_active' => true,
        ]);
        $project->users()->attach($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
            'total_minutes' => 30,
            'status' => 'rejected',
            'submitted_at' => now(),
            'rejection_reason' => 'Fix entries',
        ]);

        $entry = TimeEntry::create([
            'user_id' => $user->id,
            'timesheet_id' => $timesheet->id,
            'project_id' => $project->id,
            'task_id' => null,
            'started_at' => now()->subMinutes(30),
            'ended_at' => now(),
            'duration_minutes' => 30,
            'description' => 'Initial work',
        ]);

        $response = $this->patchJson("/api/time-entries/{$entry->id}", [
            'project_id' => $project->id,
            'description' => 'Updated work',
            'duration_minutes' => 45,
        ]);

        $response->assertStatus(200);

        $timesheet->refresh();
        $this->assertSame('draft', $timesheet->status);
        $this->assertNotNull($timesheet->submitted_at);
        $this->assertNull($timesheet->rejection_reason);
    }

    public function test_bulk_approve_and_reject(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $user = User::factory()->create();

        $submitted = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->toDateString(),
            'total_minutes' => 60,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $resubmitted = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->addDay()->toDateString(),
            'total_minutes' => 30,
            'status' => 'draft',
            'submitted_at' => now(),
        ]);

        $approve = $this->postJson('/api/admin/timesheets/bulk-approve', [
            'ids' => [$submitted->id, $resubmitted->id],
        ]);

        $approve->assertStatus(200);
        $this->assertSame('approved', $submitted->fresh()->status);
        $this->assertSame('approved', $resubmitted->fresh()->status);

        $toReject = Timesheet::create([
            'user_id' => $user->id,
            'work_date' => now()->startOfWeek()->addDays(2)->toDateString(),
            'total_minutes' => 15,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $reject = $this->postJson('/api/admin/timesheets/bulk-reject', [
            'ids' => [$toReject->id],
            'reason' => 'Needs changes',
        ]);

        $reject->assertStatus(200);
        $this->assertSame('rejected', $toReject->fresh()->status);
        $this->assertSame('Needs changes', $toReject->fresh()->rejection_reason);
    }

    public function test_admin_notes_can_be_saved(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        $user = User::factory()->create();
        $project = Project::create([
            'user_id' => $user->id,
            'name' => 'Project B',
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

        $noteRes = $this->patchJson("/api/admin/timesheets/{$timesheet->id}/note", [
            'admin_note' => 'Day note',
        ]);

        $noteRes->assertStatus(200);
        $this->assertSame('Day note', $timesheet->fresh()->admin_note);

        $entryRes = $this->patchJson("/api/admin/time-entries/{$entry->id}/note", [
            'admin_note' => 'Entry note',
        ]);

        $entryRes->assertStatus(200);
        $this->assertSame('Entry note', $entry->fresh()->admin_note);
    }

    public function test_non_admin_cannot_access_admin_endpoints(): void
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

        $response = $this->postJson('/api/admin/timesheets/bulk-approve', [
            'ids' => [$timesheet->id],
        ]);

        $response->assertStatus(403);

        $note = $this->patchJson("/api/admin/timesheets/{$timesheet->id}/note", [
            'admin_note' => 'Nope',
        ]);

        $note->assertStatus(403);
    }
}
