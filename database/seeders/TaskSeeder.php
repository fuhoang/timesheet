<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $projects = Project::all();

        if ($projects->isEmpty()) {
            $this->command->warn('No projects found. Skipping TaskSeeder.');
            return;
        }

        $defaultTasks = [
            'Planning',
            'Development',
            'Review',
        ];

        foreach ($projects as $project) {
            foreach ($defaultTasks as $name) {
                Task::firstOrCreate([
                    'project_id' => $project->id,
                    'name' => $name,
                ], [
                    'is_active' => true,
                ]);
            }
        }
    }
}
