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
                'status' => 'draft',
            ]
        );

        $timesheet->load('entries.project', 'entries.task');

        return response()->json([
            'id' => $timesheet->id,
            'work_date' => $timesheet->work_date,
            'total_minutes' => $timesheet->entries->sum('duration_minutes'),
            'status' => $timesheet->status,
            'submitted' => $timesheet->submitted_at !== null,
            'rejection_reason' => $timesheet->rejection_reason,
            'entries' => $timesheet->entries,
        ]);
    }

    public function week(Request $request)
    {
        $user = $request->user();

        // offset in weeks (0 = current week)
        $offset = (int) $request->query('offset', 0);
        $baseDate = now()->addWeeks($offset);

        $start = $baseDate->copy()->startOfWeek();
        $end   = $baseDate->copy()->endOfWeek();
        $weekComplete = now()->greaterThanOrEqualTo($end->copy()->endOfDay());

        $timesheets = Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->with('entries.project')
            ->orderBy('work_date')
            ->get();

        /**
         * Determine WEEK-LEVEL STATE
         * Locked if any day is submitted/approved/rejected.
         * Rejected remains locked until all rejected days are edited.
         */
        $hasSubmitted = $timesheets->contains('status', 'submitted');
        $hasApproved = $timesheets->contains('status', 'approved');
        $hasRejected = $timesheets->contains('status', 'rejected');

        if (!$weekComplete) {
            // In-progress week stays editable even if legacy seeded/submitted rows exist.
            $locked = false;
            $weekStatus = 'draft';
            $isSubmitted = false;
        } else {
            $locked = $hasSubmitted || $hasApproved || $hasRejected;
            $isSubmitted = $hasSubmitted;

            if ($hasApproved) {
                $weekStatus = 'approved';
            } elseif ($hasSubmitted) {
                $weekStatus = 'submitted';
            } elseif ($hasRejected) {
                $weekStatus = 'rejected';
            } else {
                $weekStatus = 'draft';
            }
        }

        $weekSheet = $timesheets->first(fn ($t) => $t->submitted_at !== null);

        $days = [];
        $weeklyTotal = 0;

        for ($i = 0; $i < 7; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();

            $sheet = $timesheets->firstWhere(
                fn ($t) => $t->work_date->toDateString() === $date
            );

            $total = $sheet?->entries->sum('duration_minutes') ?? 0;

            $weeklyTotal += $total;

            $days[] = [
                'date' => $date,
                'label' => Carbon::parse($date)->format('D d M'),
                'total_minutes' => $total,
                'entries' => $sheet?->entries ?? [],
                'status' => $sheet?->status ?? 'draft',
                'rejection_reason' => $sheet?->rejection_reason,
            ];
        }

        return response()->json([
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),

            // 🔑 REQUIRED BY UI
            'status' => $weekStatus,
            'submitted' => $isSubmitted,
            'locked' => $locked,
            'week_complete' => $weekComplete,
            'submit_available_at' => $end->copy()->endOfDay()->toIso8601String(),
            'can_submit' => $weekComplete && ! $locked,
            'submitted_at' => $weekSheet?->submitted_at,
            'approved_at' => $weekSheet?->approved_at,
            'rejection_reason' => $weekSheet?->rejection_reason,

            'weekly_total_minutes' => $weeklyTotal,
            'days' => $days,
        ]);
    }

    public function submitWeek(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'week_start' => 'required|date',
        ]);

        $start = Carbon::parse($data['week_start'])->startOfWeek();
        $end   = Carbon::parse($data['week_start'])->endOfWeek();

        if (now()->lt($end->copy()->endOfDay())) {
            return response()->json([
                'message' => 'Week is still in progress and cannot be submitted yet.',
            ], 422);
        }

        /* ----------------------------------------
           AUTO-STOP RUNNING TIMER
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

        $timesheets = Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->get();

        $submittedAt = now();
        foreach ($timesheets as $timesheet) {
            $fromStatus = $timesheet->status;
            $timesheet->update([
                'status' => 'submitted',
                'submitted_at' => $submittedAt,
            ]);
            $timesheet->logStatusTransition($fromStatus, 'submitted', $user, null, [
                'source' => 'submit_week',
            ]);
        }

        return response()->json([
            'status' => 'submitted',
        ]);
    }
}
