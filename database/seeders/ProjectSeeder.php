<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();

        Project::insert([
            [
                'user_id' => $admin->id,
                'name' => 'Internal',
                'description' => 'Internal development',
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Client A',
                'description' => 'Client A website',
            ],
            [
                'user_id' => $admin->id,
                'name' => 'Client B',
                'description' => 'Client B maintenance',
            ],
        ]);
    }
}

