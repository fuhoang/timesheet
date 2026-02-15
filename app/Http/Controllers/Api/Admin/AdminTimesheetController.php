<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use App\Models\TimeEntry;
use App\Services\TimesheetRulesEngine;
use Illuminate\Http\Request;

class AdminTimesheetController extends Controller
{
    public function __construct(private TimesheetRulesEngine $rules)
    {
    }

    /**
     * List submitted timesheets for admin review
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Timesheet::class);

        $query = Timesheet::query()
            ->whereNotNull('submitted_at')
            ->with([
                'user:id,name,email',
                'approver:id,name',
            ])
            ->orderByDesc('submitted_at');

        $status = $request->query('status');
        if ($status === 'resubmitted') {
            $query->where('status', 'draft')->whereNotNull('submitted_at');
        } elseif (in_array($status, ['draft', 'submitted', 'approved', 'rejected'], true)) {
            $query->where('status', $status);
        }

        $q = trim((string) $request->query('q', ''));
        if ($q !== '') {
            $query->whereHas('user', function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $dateFrom = $request->query('date_from');
        if ($dateFrom) {
            $query->whereDate('work_date', '>=', $dateFrom);
        }

        $dateTo = $request->query('date_to');
        if ($dateTo) {
            $query->whereDate('work_date', '<=', $dateTo);
        }

        $timesheets = $query->paginate(20);
        $timesheets->setCollection(
            $timesheets->getCollection()->map(function ($timesheet) {
                $approveRule = $this->rules->evaluateAdminApprove($timesheet);
                $rejectRule = $this->rules->evaluateAdminReject($timesheet);
                $unlockRule = $this->rules->evaluateAdminUnlock($timesheet);
                $timesheet->setAttribute('rules', [
                    'approve' => $approveRule,
                    'reject' => $rejectRule,
                    'unlock' => $unlockRule,
                ]);
                return $timesheet;
            })
        );

        return response()->json($timesheets);
    }

    /**
     * Bulk approve submitted timesheets
     */
    public function bulkApprove(Request $request)
    {
        $this->authorize('viewAny', Timesheet::class);

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:timesheets,id',
        ]);

        $ids = array_values(array_unique($data['ids']));

        $timesheets = Timesheet::whereIn('id', $ids)->get();

        $eligible = $timesheets->filter(fn ($t) => $this->rules->evaluateAdminApprove($t)['allowed']);

        if ($eligible->isEmpty()) {
            return response()->json([
                'message' => 'No submitted timesheets to approve',
                'rule' => [
                    'reason' => 'not_submitted_or_already_approved',
                ],
            ], 422);
        }

        $now = now();
        $adminId = $request->user()->id;

        foreach ($eligible as $timesheet) {
            $fromStatus = $timesheet->status;
            $timesheet->update([
                'status' => 'approved',
                'approved_at' => $now,
                'approved_by' => $adminId,
                'rejection_reason' => null,
            ]);
            $timesheet->logStatusTransition($fromStatus, 'approved', $request->user(), null, [
                'source' => 'bulk_approve',
            ]);
        }

        return response()->json([
            'message' => 'Timesheets approved',
            'approved_count' => $eligible->count(),
            'skipped_count' => $timesheets->count() - $eligible->count(),
        ]);
    }

    /**
     * Bulk reject submitted timesheets
     */
    public function bulkReject(Request $request)
    {
        $this->authorize('viewAny', Timesheet::class);

        $data = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:timesheets,id',
            'reason' => 'required|string|max:500',
        ]);

        $ids = array_values(array_unique($data['ids']));

        $timesheets = Timesheet::whereIn('id', $ids)->get();

        $eligible = $timesheets->filter(fn ($t) => $this->rules->evaluateAdminReject($t)['allowed']);

        if ($eligible->isEmpty()) {
            return response()->json([
                'message' => 'No submitted timesheets to reject',
                'rule' => [
                    'reason' => 'not_submitted_or_already_approved',
                ],
            ], 422);
        }

        foreach ($eligible as $timesheet) {
            $fromStatus = $timesheet->status;
            $timesheet->update([
                'status' => 'rejected',
                'rejection_reason' => $data['reason'],
                'approved_at' => null,
                'approved_by' => null,
            ]);
            $timesheet->logStatusTransition($fromStatus, 'rejected', $request->user(), $data['reason'], [
                'source' => 'bulk_reject',
            ]);
        }

        return response()->json([
            'message' => 'Timesheets rejected',
            'rejected_count' => $eligible->count(),
            'skipped_count' => $timesheets->count() - $eligible->count(),
        ]);
    }

    /**
     * View a single timesheet (read-only)
     */
    public function show(Timesheet $timesheet)
    {
        $this->authorize('view', $timesheet);

        $timesheet->load([
            'user:id,name,email',
            'entries.project:id,name',
            'entries.task:id,name',
            'approver:id,name',
        ]);

        return response()->json($timesheet);
    }

    /**
     * Update admin note for a day (timesheet)
     */
    public function updateNote(Request $request, Timesheet $timesheet)
    {
        $this->authorize('view', $timesheet);

        $data = $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $timesheet->update([
            'admin_note' => $data['admin_note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Admin note saved',
            'timesheet' => $timesheet,
        ]);
    }

    /**
     * Update admin note for a time entry
     */
    public function updateEntryNote(Request $request, TimeEntry $timeEntry)
    {
        $this->authorize('viewAny', Timesheet::class);

        $data = $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $timeEntry->update([
            'admin_note' => $data['admin_note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Entry note saved',
            'entry' => $timeEntry->fresh(),
        ]);
    }

    /**
     * Approve a submitted timesheet
     */
    public function approve(Request $request, Timesheet $timesheet)
    {
        $this->authorize('approve', $timesheet);

        $rule = $this->rules->evaluateAdminApprove($timesheet);
        if (!$rule['allowed']) {
            return response()->json([
                'message' => $rule['message'],
                'rule' => [
                    'reason' => $rule['reason'],
                ],
            ], 422);
        }

        $fromStatus = $timesheet->status;
        $timesheet->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);
        $timesheet->logStatusTransition($fromStatus, 'approved', $request->user());

        return response()->json([
            'message' => 'Timesheet approved',
            'timesheet' => $timesheet,
        ]);
    }

    /**
     * Reject a submitted timesheet
     */
    public function reject(Request $request, Timesheet $timesheet)
    {
        $this->authorize('reject', $timesheet);

        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $rule = $this->rules->evaluateAdminReject($timesheet);
        if (!$rule['allowed']) {
            return response()->json([
                'message' => $rule['message'],
                'rule' => [
                    'reason' => $rule['reason'],
                ],
            ], 422);
        }

        $rule = $this->rules->evaluateAdminUnlock($timesheet);
        if (!$rule['allowed']) {
            return response()->json([
                'message' => $rule['message'],
                'rule' => [
                    'reason' => $rule['reason'],
                ],
            ], 422);
        }

        $fromStatus = $timesheet->status;
        $timesheet->update([
            'status' => 'rejected',
            'rejection_reason' => $data['reason'],
            'approved_at' => null,
            'approved_by' => null,
        ]);
        $timesheet->logStatusTransition($fromStatus, 'rejected', $request->user(), $data['reason']);

        return response()->json([
            'message' => 'Timesheet rejected',
            'timesheet' => $timesheet,
        ]);
    }

    /**
     * (Optional) Unlock a timesheet
     * Use sparingly – audit trail preserved
     */
    public function unlock(Request $request, Timesheet $timesheet)
    {
        $this->authorize('unlock', $timesheet);

        $fromStatus = $timesheet->status;
        $timesheet->update([
            'status' => 'draft',
            'submitted_at' => null,
            'approved_at' => null,
            'approved_by' => null,
            'rejection_reason' => null,
        ]);
        $timesheet->logStatusTransition($fromStatus, 'draft', $request->user(), null, [
            'source' => 'unlock',
        ]);

        return response()->json([
            'message' => 'Timesheet unlocked',
        ]);
    }

    public function history(Timesheet $timesheet)
    {
        $this->authorize('view', $timesheet);

        $history = $timesheet->statusHistory()
            ->with('actor:id,name,email')
            ->get();

        return response()->json($history);
    }
}
