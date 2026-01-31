<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
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
