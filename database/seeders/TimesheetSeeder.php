<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Project;
use App\Models\Timesheet;
use Carbon\Carbon;

class TimesheetSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $project = Project::first();

        if (!$user || !$project) {
            $this->command->error('User or Project missing.');
            return;
        }

        // last 3 weeks (Mon–Fri)
        for ($week = 0; $week < 3; $week++) {

            for ($day = 1; $day <= 5; $day++) {

                $date = Carbon::now()
                    ->startOfWeek()
                    ->subWeeks($week)
                    ->addDays($day - 1);

                // ✅ create timesheet FIRST
                $timesheet = Timesheet::create([
                    'user_id' => $user->id,
                    'work_date' => $date->toDateString(),
                    'total_minutes' => 0,
                ]);

                $total = 0;

                // create 2 entries per day
                for ($i = 0; $i < 2; $i++) {

                    $start = $date->copy()->setTime(9 + ($i * 2), 0);
                    $end   = $start->copy()->addMinutes(90);

                    $minutes = $start->diffInMinutes($end);
                    $total += $minutes;

                    // ✅ entries belong to timesheet
                    $timesheet->entries()->create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'description' => 'Seeded work entry',
                        'started_at' => $start,
                        'ended_at' => $end,
                        'duration_minutes' => $minutes,
                    ]);
                }

                // update daily total
                $timesheet->update([
                    'total_minutes' => $total,
                ]);
            }
        }

        $this->command->info('3 weeks of timesheets seeded successfully.');
    }
}
