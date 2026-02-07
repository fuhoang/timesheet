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
        $user = User::where('email', 'user@test.com')->first();

        if (!$admin) {
            $this->command->warn('Admin user not found. Skipping ProjectSeeder.');
            return;
        }

        $projects = [
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
        ];

        if ($user) {
            $projects[] = [
                'user_id' => $user->id,
                'name' => 'Personal',
                'description' => 'Personal tasks',
            ];
        }

        foreach ($projects as $project) {
            $record = Project::firstOrCreate([
                'user_id' => $project['user_id'],
                'name' => $project['name'],
            ], [
                'description' => $project['description'],
                'is_active' => true,
            ]);

            $record->users()->syncWithoutDetaching([$project['user_id']]);
        }
    }
}
