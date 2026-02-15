<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRulesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Timesheet::class);

        return response()->json([
            'statuses' => ['draft', 'submitted', 'approved', 'rejected'],
            'admin_actions' => [
                [
                    'action' => 'approve',
                    'allowed_when' => 'submitted_at exists and not already approved',
                    'blocked_reasons' => ['already_approved', 'not_submitted'],
                    'override_supported' => true,
                    'override_requires_reason' => true,
                ],
                [
                    'action' => 'reject',
                    'allowed_when' => 'submitted_at exists and not already approved',
                    'blocked_reasons' => ['already_approved', 'not_submitted'],
                    'override_supported' => true,
                    'override_requires_reason' => true,
                ],
                [
                    'action' => 'unlock',
                    'allowed_when' => 'timesheet is currently locked/submitted/reviewed',
                    'blocked_reasons' => ['already_unlocked'],
                    'override_supported' => true,
                    'override_requires_reason' => true,
                ],
            ],
            'rule_reasons' => [
                'week_in_progress' => 'Current week is in progress and cannot be submitted.',
                'already_submitted_or_reviewed' => 'Week was already submitted or reviewed.',
                'approved_locked' => 'Approved timesheets are locked.',
                'already_approved' => 'Timesheet is already approved.',
                'not_submitted' => 'Timesheet has not been submitted.',
                'already_unlocked' => 'Timesheet is already unlocked.',
            ],
            'override_contract' => [
                'fields' => ['override', 'override_reason'],
                'audit_payload' => [
                    'override.used',
                    'override.reason',
                    'override.rule_reason',
                    'override.rule_message',
                    'override.action',
                    'override.request_id',
                ],
            ],
        ]);
    }
}

