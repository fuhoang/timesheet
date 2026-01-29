<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use Illuminate\Http\Request;

class AdminTimesheetController extends Controller
{
    public function index()
    {
        return Timesheet::with('user')
            ->where('status', 'submitted')
            ->orderBy('work_date')
            ->get();
    }

    public function approve(Request $request, Timesheet $timesheet)
    {
        $timesheet->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        return response()->json(['status' => 'approved']);
    }

    public function reject(Request $request, Timesheet $timesheet)
    {
        $request->validate([
            'reason' => 'required|string',
        ]);

        $timesheet->update([
            'status' => 'rejected',
        ]);

        return response()->json(['status' => 'rejected']);
    }
}
