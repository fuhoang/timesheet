<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        return $timesheet->load('entries.project', 'entries.task');
    }
    public function week(Request $request)
    {
        $user = $request->user();

        // week param OR today
        $baseDate = $request->week
            ? \Carbon\Carbon::parse($request->week)
            : now();

        $start = $baseDate->copy()->startOfWeek();
        $end   = $baseDate->copy()->endOfWeek();

        $timesheets = \App\Models\Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->with('entries.project')
            ->get()
            ->keyBy(fn ($t) => $t->work_date->toDateString());

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
            'days' => $days,
        ]);
    }

}
