<?php
// database/seeders/TimeEntrySeeder.php

namespace Database\Seeders;

use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class TimeEntrySeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'user@test.com')->first();
        $project = Project::first();

        if (!$user || !$project) {
            $this->command->warn('User or Project missing. Skipping TimeEntrySeeder.');
            return;
        }

        $timesheet = Timesheet::firstOrCreate([
            'user_id' => $user->id,
            'work_date' => now()->toDateString(),
        ], [
            'status' => 'draft',
            'total_minutes' => 0,
        ]);

        if ($timesheet->entries()->exists()) {
            return;
        }

        $entries = [
            [
                'started_at' => now()->subHours(2),
                'ended_at' => now()->subHour(),
                'duration_minutes' => 60,
                'description' => 'Initial setup',
            ],
            [
                'started_at' => now()->subHour(),
                'ended_at' => now(),
                'duration_minutes' => 60,
                'description' => 'API work',
            ],
        ];

        foreach ($entries as $data) {
            $payload = array_merge($data, [
                'user_id' => $timesheet->user_id,
                'timesheet_id' => $timesheet->id,
                'project_id' => $project->id,
            ]);

            if (Schema::hasColumn('time_entries', 'admin_note')) {
                $payload['admin_note'] = 'Seeded entry note';
            }

            TimeEntry::create($payload);
        }

        $timesheet->update([
            'total_minutes' => $timesheet->entries()->sum('duration_minutes'),
        ]);
    }
}
