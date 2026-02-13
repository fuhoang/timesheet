<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_public_and_returns_ok(): void
    {
        $this->getJson('/api/health')
            ->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
                'app' => 'timesheet',
            ])
            ->assertJsonStructure(['timestamp']);
    }

    public function test_ready_endpoint_reports_database_status(): void
    {
        $this->getJson('/api/ready')
            ->assertStatus(200)
            ->assertJson([
                'status' => 'ready',
                'db' => 'ok',
            ])
            ->assertJsonStructure(['timestamp']);
    }
}

