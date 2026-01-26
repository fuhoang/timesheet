<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\TimeEntry;
use Carbon\Carbon;

class StopRunningTimersAtMidnight extends Command
{
    protected $signature = 'timers:auto-stop-midnight';

    protected $description = 'Automatically stop running timers at midnight';

    public function handle(): int
    {
        $midnight = Carbon::today();

        $entries = TimeEntry::whereNull('ended_at')
            ->where('started_at', '<', $midnight)
            ->with('timesheet')
            ->get();

        foreach ($entries as $entry) {

            // stop at 23:59:59
            $end = $midnight->copy()->subSecond();

            $minutes = $entry->started_at->diffInMinutes($end);

            $entry->update([
                'ended_at' => $end,
                'duration_minutes' => $minutes,
            ]);

            // recalc timesheet
            $entry->timesheet->update([
                'total_minutes' =>
                    $entry->timesheet
                        ->entries()
                        ->sum('duration_minutes'),
            ]);
        }

        $this->info('Running timers stopped at midnight.');

        return Command::SUCCESS;
    }
}
