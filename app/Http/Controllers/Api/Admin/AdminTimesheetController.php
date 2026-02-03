<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use App\Models\TimeEntry;
use Illuminate\Http\Request;

class AdminTimesheetController extends Controller
{
    /**
     * List submitted timesheets for admin review
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Timesheet::class);

        $timesheets = Timesheet::query()
            ->whereNotNull('submitted_at')
            ->with([
                'user:id,name,email',
                'approver:id,name',
            ])
            ->orderByDesc('submitted_at')
            ->paginate(20);

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

        $eligible = $timesheets->where('status', 'submitted');

        if ($eligible->isEmpty()) {
            return response()->json([
                'message' => 'No submitted timesheets to approve',
            ], 422);
        }

        $now = now();
        $adminId = $request->user()->id;

        foreach ($eligible as $timesheet) {
            $timesheet->update([
                'status' => 'approved',
                'approved_at' => $now,
                'approved_by' => $adminId,
                'rejection_reason' => null,
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

        $eligible = $timesheets->where('status', 'submitted');

        if ($eligible->isEmpty()) {
            return response()->json([
                'message' => 'No submitted timesheets to reject',
            ], 422);
        }

        foreach ($eligible as $timesheet) {
            $timesheet->update([
                'status' => 'rejected',
                'rejection_reason' => $data['reason'],
                'approved_at' => null,
                'approved_by' => null,
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

        if ($timesheet->approved_at) {
            return response()->json([
                'message' => 'Timesheet already approved',
            ], 422);
        }

        $timesheet->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

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

        if ($timesheet->approved_at) {
            return response()->json([
                'message' => 'Approved timesheets cannot be rejected',
            ], 422);
        }

        $timesheet->update([
            'status' => 'rejected',
            'rejection_reason' => $data['reason'],
            'approved_at' => null,
            'approved_by' => null,
        ]);

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

        $timesheet->update([
            'status' => 'draft',
            'submitted_at' => null,
            'approved_at' => null,
            'approved_by' => null,
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Timesheet unlocked',
        ]);
    }
}
