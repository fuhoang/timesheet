<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

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

        $response = $this->getJson('/api/reports')
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

        $response = $this->getJson('/api/reports?status=approved&project_id=' . $projectA->id . '&user_id=' . $user->id)
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

        $response = $this->getJson('/api/reports')
            ->assertStatus(200)
            ->json();

        $this->assertSame(false, $response['meta']['filters']['include_drafts']);
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

        $response = $this->getJson('/api/reports?include_drafts=1')
            ->assertStatus(200)
            ->json();

        $this->assertSame(true, $response['meta']['filters']['include_drafts']);
    }
}
