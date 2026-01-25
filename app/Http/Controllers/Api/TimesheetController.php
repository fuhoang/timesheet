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

        $date = $request->date
            ? Carbon::parse($request->date)
            : now();

        $start = $date->copy()->startOfWeek(); // Monday
        $end   = $date->copy()->endOfWeek();   // Sunday

        $entries = $user->timeEntries()
            ->with('project')
            ->whereBetween('started_at', [$start, $end])
            ->orderBy('started_at')
            ->get();

        $days = [];

        foreach ($entries as $entry) {
            $day = $entry->started_at->format('Y-m-d');

            if (!isset($days[$day])) {
                $days[$day] = [
                    'date' => $day,
                    'entries' => [],
                    'total_minutes' => 0,
                ];
            }

            if ($entry->ended_at) {
                $minutes = $entry->ended_at->diffInMinutes($entry->started_at);
                $days[$day]['total_minutes'] += $minutes;
            }

            $days[$day]['entries'][] = $entry;
        }

        return response()->json([
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'days' => array_values($days),
            'total_minutes' => collect($days)->sum('total_minutes'),
        ]);
    }
}
