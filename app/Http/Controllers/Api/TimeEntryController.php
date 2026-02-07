<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
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

        if (!$request->user()->projects()->whereKey($data['project_id'])->exists()) {
            return response()->json([
                'message' => 'Project is not assigned to this user',
            ], 403);
        }

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


    public function update(Request $request, TimeEntry $timeEntry)
    {
        $timesheet = $timeEntry->timesheet;

        if (!$timesheet) {
            abort(404, 'Timesheet not found');
        }

        // 🔐 Authorize against TIMESHEET
        $this->authorize('update', $timesheet);

        // ❌ Approved timesheets are immutable
        if ($timesheet->status === 'approved') {
            return response()->json([
                'message' => 'Approved timesheets cannot be edited',
            ], 403);
        }

        $data = $request->validate([
            'description' => 'nullable|string|max:500',
            'project_id'  => 'required|exists:projects,id',
            'task_id'     => 'nullable|exists:tasks,id',
            'duration_minutes' => 'required|integer|min:0',
        ]);

        if (!$request->user()->projects()->whereKey($data['project_id'])->exists()) {
            return response()->json([
                'message' => 'Project is not assigned to this user',
            ], 403);
        }

        // ✅ Update entry
        $timeEntry->update($data);

        /**
         * 🔑 CRITICAL FIX
         * If timesheet was rejected → reset only this day.
         * The week stays locked until all rejected days are edited.
         */
        if ($timesheet->status === 'rejected') {
            $timesheet->update([
                'status' => 'draft',
                'rejection_reason' => null,
                'approved_at' => null,
                'approved_by' => null,
            ]);
        }

        // 🔄 Recalculate daily total
        $timesheet->update([
            'total_minutes' => $timesheet->entries()->sum('duration_minutes'),
        ]);

        return response()->json([
            'entry' => $timeEntry->fresh('project', 'task'),
            'timesheet_status' => $timesheet->status,
        ]);
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
