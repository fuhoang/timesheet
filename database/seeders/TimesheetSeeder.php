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
        $user = User::where('email', 'user@test.com')->first();
        $project = Project::first();

        if (!$user || !$project) {
            $this->command->error('User or Project missing.');
            return;
        }

        $users = collect([$user])->filter();

        // last 2 weeks (Mon–Fri)
        for ($week = 0; $week < 2; $week++) {

            for ($day = 1; $day <= 5; $day++) {

                $date = Carbon::now()
                    ->startOfWeek()
                    ->subWeeks($week)
                    ->addDays($day - 1);

                foreach ($users as $seedUser) {
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
                                'project_id' => $project->id,
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

                    // Set some example statuses on last week
                    if ($week === 0 && $day === 5) {
                        $timesheet->update([
                            'status' => 'submitted',
                            'submitted_at' => now(),
                        ]);
                    }

                    if ($week === 1 && $day === 3) {
                        $timesheet->update([
                            'status' => 'rejected',
                            'submitted_at' => now(),
                            'rejection_reason' => 'Please clarify description',
                        ]);
                    }

                    if ($week === 1 && $day === 4 && $admin) {
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
        }

        $this->command->info('2 weeks of timesheets seeded successfully.');
    }
}
