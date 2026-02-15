<?php

namespace App\Services;

use App\Models\Timesheet;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class TimesheetRulesEngine
{
    public function evaluateWeek(Collection $timesheets, Carbon $weekEnd, ?Carbon $now = null): array
    {
        $current = ($now ?? now())->copy();
        $weekComplete = $current->greaterThanOrEqualTo($weekEnd->copy()->endOfDay());

        $hasSubmitted = $timesheets->contains('status', 'submitted');
        $hasApproved = $timesheets->contains('status', 'approved');
        $hasRejected = $timesheets->contains('status', 'rejected');

        if (!$weekComplete) {
            return [
                'week_complete' => false,
                'status' => 'draft',
                'submitted' => false,
                'locked' => false,
                'can_submit' => false,
                'submit_blocked_reason' => 'week_in_progress',
                'submit_blocked_message' => 'Week is still in progress and cannot be submitted yet.',
            ];
        }

        $locked = $hasSubmitted || $hasApproved || $hasRejected;
        $status = 'draft';
        if ($hasApproved) {
            $status = 'approved';
        } elseif ($hasSubmitted) {
            $status = 'submitted';
        } elseif ($hasRejected) {
            $status = 'rejected';
        }

        return [
            'week_complete' => true,
            'status' => $status,
            'submitted' => $hasSubmitted,
            'locked' => $locked,
            'can_submit' => !$locked,
            'submit_blocked_reason' => $locked ? 'already_submitted_or_reviewed' : null,
            'submit_blocked_message' => $locked ? 'Week has already been submitted or reviewed.' : null,
        ];
    }

    public function evaluateTimesheetEdit(Timesheet $timesheet): array
    {
        if ($timesheet->status === 'approved') {
            return [
                'allowed' => false,
                'reason' => 'approved_locked',
                'message' => 'Approved timesheets cannot be edited',
                'can_reopen' => false,
            ];
        }

        return [
            'allowed' => true,
            'reason' => null,
            'message' => null,
            'can_reopen' => in_array($timesheet->status, ['submitted', 'rejected'], true),
        ];
    }

    public function evaluateAdminApprove(Timesheet $timesheet): array
    {
        if ($this->hasRawAttributeValue($timesheet, 'approved_at') || $timesheet->status === 'approved') {
            return [
                'allowed' => false,
                'reason' => 'already_approved',
                'message' => 'Timesheet already approved',
            ];
        }

        if (!$this->hasRawAttributeValue($timesheet, 'submitted_at')) {
            return [
                'allowed' => false,
                'reason' => 'not_submitted',
                'message' => 'Timesheet is not submitted',
            ];
        }

        return [
            'allowed' => true,
            'reason' => null,
            'message' => null,
        ];
    }

    public function evaluateAdminReject(Timesheet $timesheet): array
    {
        if ($this->hasRawAttributeValue($timesheet, 'approved_at') || $timesheet->status === 'approved') {
            return [
                'allowed' => false,
                'reason' => 'already_approved',
                'message' => 'Approved timesheets cannot be rejected',
            ];
        }

        if (!$this->hasRawAttributeValue($timesheet, 'submitted_at')) {
            return [
                'allowed' => false,
                'reason' => 'not_submitted',
                'message' => 'Timesheet is not submitted',
            ];
        }

        return [
            'allowed' => true,
            'reason' => null,
            'message' => null,
        ];
    }

    public function evaluateAdminUnlock(Timesheet $timesheet): array
    {
        if (!$this->hasRawAttributeValue($timesheet, 'submitted_at') && $timesheet->status === 'draft') {
            return [
                'allowed' => false,
                'reason' => 'already_unlocked',
                'message' => 'Timesheet is already unlocked',
            ];
        }

        return [
            'allowed' => true,
            'reason' => null,
            'message' => null,
        ];
    }

    private function hasRawAttributeValue(Timesheet $timesheet, string $key): bool
    {
        $attributes = $timesheet->getAttributes();
        return !empty($attributes[$key]);
    }
}
