<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    //

    public function start(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'nullable|exists:tasks,id',
            'description' => 'nullable|string',
        ]);

        $timesheet = $request->user()
            ->timesheets()
            ->firstOrCreate([
                'work_date' => now()->toDateString(),
            ]);

        // prevent multiple running timers
        $running = $timesheet->entries()
            ->whereNull('ended_at')
            ->exists();

        if ($running) {
            return response()->json([
                'message' => 'Timer already running'
            ], 422);
        }

        $entry = $timesheet->entries()->create([
            'user_id' => $request->user()->id,
            'project_id' => $data['project_id'],
            'task_id' => $data['task_id'] ?? null,
            'started_at' => now(),
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($entry, 201);
    }

    public function stop(Request $request)
    {
        $timesheet = $request->user()
            ->timesheets()
            ->where('work_date', now()->toDateString())
            ->firstOrFail();

        $entry = $timesheet->entries()
            ->whereNull('ended_at')
            ->firstOrFail();

        $entry->ended_at = now();

        $minutes = $entry->started_at->diffInMinutes($entry->ended_at);
        $entry->duration_minutes = $minutes;
        $entry->save();

        // update daily total
        $timesheet->total_minutes += $minutes;
        $timesheet->save();

        return response()->json($entry);
    }


}
