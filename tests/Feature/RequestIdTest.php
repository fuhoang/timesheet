<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RequestIdTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_responses_include_request_id_header(): void
    {
        $response = $this->getJson('/api/health')
            ->assertStatus(200);

        $response->assertHeader('X-Request-Id');
    }

    public function test_json_errors_include_request_id_body(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/time-entries/start', [])
            ->assertStatus(422)
            ->assertJsonStructure(['message', 'errors', 'request_id']);

        $response->assertHeader('X-Request-Id');
    }
}
