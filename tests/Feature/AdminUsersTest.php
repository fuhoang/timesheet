<?php

namespace Tests\Feature;

use App\Models\AdminProjectAssignmentLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_users_role_filter(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false]);

        Sanctum::actingAs($admin);

        $admins = $this->getJson('/api/admin/users?role=admin')
            ->assertStatus(200)
            ->json('users.data');

        $this->assertNotEmpty($admins);
        $this->assertTrue(collect($admins)->every(fn ($u) => (int) $u['is_admin'] === 1));

        $users = $this->getJson('/api/admin/users?role=user')
            ->assertStatus(200)
            ->json('users.data');

        $this->assertNotEmpty($users);
        $this->assertTrue(collect($users)->every(fn ($u) => (int) $u['is_admin'] === 0));
        $this->assertTrue(collect($users)->pluck('id')->contains($user->id));
    }

    public function test_admin_users_include_logs_returns_assignment_log(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false]);
        $project = Project::create([
            'user_id' => $admin->id,
            'name' => 'Project X',
            'description' => null,
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->putJson("/api/admin/users/{$user->id}/projects", [
            'project_ids' => [$project->id],
        ])->assertStatus(200);

        $response = $this->getJson('/api/admin/users?include_logs=1')
            ->assertStatus(200)
            ->json();

        $this->assertArrayHasKey('assignment_logs', $response);
        $this->assertNotEmpty($response['assignment_logs']);

        $log = AdminProjectAssignmentLog::latest()->first();
        $this->assertNotNull($log);
        $this->assertSame($admin->id, $log->admin_id);
        $this->assertSame($user->id, $log->user_id);
    }
}
