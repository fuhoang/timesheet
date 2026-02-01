<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    /**
     * Start a time entry
     */
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
            ], [
                'status' => 'draft',
            ]);

        // // 🔐 POLICY ENFORCEMENT
        // $this->authorize('edit', $timesheet);

        // Prevent multiple running timers
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

    /**
     * Stop a running time entry
     */
    public function stop(Request $request)
    {
        $timesheet = $request->user()
            ->timesheets()
            ->where('work_date', now()->toDateString())
            ->firstOrFail();

        // 🔐 POLICY ENFORCEMENT
        // $this->authorize('edit', $timesheet);

        $entry = $timesheet->entries()
            ->whereNull('ended_at')
            ->firstOrFail();

        $entry->ended_at = now();
        $entry->duration_minutes =
            $entry->started_at->diffInMinutes($entry->ended_at);

        $entry->save();

        // Update daily total
        $timesheet->update([
            'total_minutes' =>
                $timesheet->entries()->sum('duration_minutes'),
        ]);

        return response()->json($entry);
    }

    /**
     * Get currently running entry (if any)
     */
    public function running(Request $request)
    {
        $user = $request->user();

        $entry = $user->timeEntries()
            ->whereNull('ended_at')
            ->with('project', 'timesheet')
            ->first();

        if (!$entry) {
            return response()->json(null);
        }

        // 🔐 POLICY CHECK (read-only but still validated)
        // $this->authorize('edit', $entry->timesheet);

        /*
        |--------------------------------------------------------------------------
        | SAFETY FALLBACK — auto-stop at midnight
        |--------------------------------------------------------------------------
        */
        if ($entry->started_at->lt(today())) {

            $end = $entry->started_at->copy()->endOfDay();

            $entry->update([
                'ended_at' => $end,
                'duration_minutes' =>
                    $entry->started_at->diffInMinutes($end),
            ]);

            $entry->timesheet->update([
                'total_minutes' =>
                    $entry->timesheet
                        ->entries()
                        ->sum('duration_minutes'),
            ]);

            return response()->json(null);
        }

        return response()->json($entry);
    }
}
