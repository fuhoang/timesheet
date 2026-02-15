<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
use App\Models\Timesheet;
use App\Services\TimesheetRulesEngine;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TimesheetController extends Controller
{
    public function __construct(private TimesheetRulesEngine $rules)
    {
    }

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
        $timesheets = Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->with('entries.project')
            ->orderBy('work_date')
            ->get();

        $weekRules = $this->rules->evaluateWeek($timesheets, $end);

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
            'status' => $weekRules['status'],
            'submitted' => $weekRules['submitted'],
            'locked' => $weekRules['locked'],
            'week_complete' => $weekRules['week_complete'],
            'submit_available_at' => $end->copy()->endOfDay()->toIso8601String(),
            'can_submit' => $weekRules['can_submit'],
            'submit_blocked_reason' => $weekRules['submit_blocked_reason'],
            'submit_blocked_message' => $weekRules['submit_blocked_message'],
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

        $timesheets = Timesheet::where('user_id', $user->id)
            ->whereBetween('work_date', [$start, $end])
            ->get();
        $weekRules = $this->rules->evaluateWeek($timesheets, $end);
        if (!$weekRules['can_submit']) {
            return response()->json([
                'message' => $weekRules['submit_blocked_message'] ?? 'Week cannot be submitted',
                'rule' => [
                    'reason' => $weekRules['submit_blocked_reason'],
                    'week_complete' => $weekRules['week_complete'],
                    'locked' => $weekRules['locked'],
                ],
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
