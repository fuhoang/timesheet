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
        $users = User::all();

        if (!$admin || $users->isEmpty()) {
            $this->command->warn('Users not found. Skipping ProjectSeeder.');
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

        for ($i = 1; $i <= 20; $i++) {
            $owner = $users->random();
            $projects[] = [
                'user_id' => $owner->id,
                'name' => "Project {$i}",
                'description' => "Seeded project {$i}",
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

            $assignees = $users->random(min(3, $users->count()))->pluck('id')->all();
            $assignees[] = $project['user_id'];
            $record->users()->syncWithoutDetaching(array_unique($assignees));
        }
    }
}
