<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Timesheet;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class TimesheetSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@test.com')->first();
        $users = User::all();
        $project = Project::first();

        if ($users->isEmpty() || !$project) {
            $this->command->error('User or Project missing.');
            return;
        }

        $startDate = Carbon::now()->subDays(30)->startOfDay();
        $endDate = Carbon::now()->startOfDay();

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // skip weekends
            if ($date->isWeekend()) {
                continue;
            }

            foreach ($users as $seedUser) {
                $userProject = Project::where('user_id', $seedUser->id)->first() ?? $project;
                $timesheet = Timesheet::updateOrCreate([
                    'user_id' => $seedUser->id,
                    'work_date' => $date->toDateString(),
                ], [
                    'total_minutes' => 0,
                    'status' => 'draft',
                ]);

                if ($timesheet->entries()->count() === 0) {
                    $total = 0;

                    // create 2 entries per day
                    for ($i = 0; $i < 2; $i++) {
                        $start = $date->copy()->setTime(9 + ($i * 2), 0);
                        $end   = $start->copy()->addMinutes(90);

                        $minutes = $start->diffInMinutes($end);
                        $total += $minutes;

                        $timesheet->entries()->create([
                            'user_id' => $seedUser->id,
                            'project_id' => $userProject->id,
                            'description' => 'Seeded work entry',
                            'started_at' => $start,
                            'ended_at' => $end,
                            'duration_minutes' => $minutes,
                        ]);
                    }

                    $timesheet->update([
                        'total_minutes' => $total,
                    ]);
                }

                // Set some example statuses in the recent range
                if ($date->isSameDay($endDate->copy()->subDays(2))) {
                    $timesheet->update([
                        'status' => 'submitted',
                        'submitted_at' => now(),
                    ]);
                }

                if ($date->isSameDay($endDate->copy()->subDays(10)) || $date->isSameDay($endDate->copy()->subDays(20))) {
                    $timesheet->update([
                        'status' => 'rejected',
                        'submitted_at' => now(),
                        'rejection_reason' => 'Please clarify description',
                    ]);
                }

                if ($date->isSameDay($endDate->copy()->subDays(15)) && $admin) {
                    $timesheet->update([
                        'status' => 'approved',
                        'submitted_at' => now(),
                        'approved_at' => now(),
                        'approved_by' => $admin->id,
                        'rejection_reason' => null,
                    ]);
                }

                if (Schema::hasColumn('timesheets', 'admin_note')) {
                    $timesheet->update([
                        'admin_note' => 'Seeded admin note',
                    ]);
                }
            }
        }

        $this->command->info('30 days of timesheets seeded successfully.');
    }
}
