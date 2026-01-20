<?php
// database/seeders/TimeEntrySeeder.php

namespace Database\Seeders;

use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\Project;
use Illuminate\Database\Seeder;

class TimeEntrySeeder extends Seeder
{
    public function run(): void
    {
        $timesheet = Timesheet::first();
        $project = Project::first();

        TimeEntry::create([
            'user_id' => $timesheet->user_id,
            'timesheet_id' => $timesheet->id,
            'project_id' => $project->id,
            'started_at' => now()->subHours(2),
            'ended_at' => now()->subHour(),
            'duration_minutes' => 60,
            'description' => 'Initial setup',
        ]);

        TimeEntry::create([
            'user_id' => $timesheet->user_id,
            'timesheet_id' => $timesheet->id,
            'project_id' => $project->id,
            'started_at' => now()->subHour(),
            'ended_at' => now(),
            'duration_minutes' => 60,
            'description' => 'API work',
        ]);
    }
}

