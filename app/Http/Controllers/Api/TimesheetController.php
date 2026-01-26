<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TimesheetController extends Controller
{
    public function today(Request $request)
    {
        $date = Carbon::today();

        $timesheet = Timesheet::firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'work_date' => $date,
            ],
            [
                'total_minutes' => 0,
            ]
        );

        $timesheet->load('entries.project', 'entries.task');

        return response()->json([
            'id' => $timesheet->id,
            'work_date' => $timesheet->work_date,
            'total_minutes' => $timesheet->entries->sum('duration_minutes'),
            'submitted' => $timesheet->submitted_at !== null,
            'entries' => $timesheet->entries,
        ]);
    }
    public function week(Request $request)
    {
        $user = $request->user();

        // offset in weeks from current week (0 = this week, -1 = previous week, 1 = next week)
        $offset = (int) $request->query('offset', 0);
        $baseDate = now()->addWeeks($offset);

        $start = $baseDate->copy()->startOfWeek();
        $end   = $baseDate->copy()->endOfWeek();

        $timesheets = \App\Models\Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->with('entries.project')
            ->get()
            ->keyBy(fn ($t) => $t->work_date->toDateString());

        $submitted = $timesheets->first()?->submitted_at !== null;

        $days = [];
        $weeklyTotal = 0;

        for ($i = 0; $i < 7; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();

            $sheet = $timesheets[$date] ?? null;

            $total = $sheet?->entries->sum('duration_minutes') ?? 0;

            $weeklyTotal += $total;

            $days[] = [
                'date' => $date,
                'label' => \Carbon\Carbon::parse($date)->format('D d M'),
                'total_minutes' => $total,
                'entries' => $sheet?->entries ?? [],
            ];
        }

        return response()->json([
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'weekly_total_minutes' => $weeklyTotal,
            'submitted' => $submitted,
            'days' => $days,
        ]);
    }



    public function submitWeek(Request $request)
    {
        $user = $request->user();

        $start = Carbon::parse($request->week_start)->startOfWeek();
        $end   = Carbon::parse($request->week_start)->endOfWeek();

        /* ----------------------------------------
            1. AUTO-STOP RUNNING TIMER
        ---------------------------------------- */

        $running = TimeEntry::where('user_id', $user->id)
            ->whereNull('ended_at')
            ->first();

        if ($running) {
            $now = now();

            $minutes = $running->started_at->diffInMinutes($now);

            $running->update([
                'ended_at' => $now,
                'duration_minutes' => $minutes,
            ]);
        }

        Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->update([
                'submitted' => true,
                'submitted_at' => now(),
            ]);

        return response()->json(['status' => 'submitted']);
    }

}
