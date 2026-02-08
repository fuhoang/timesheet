<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $startParam = $request->query('start');
        $endParam = $request->query('end');

        $start = $startParam
            ? Carbon::parse($startParam)->startOfDay()
            : now()->startOfWeek();
        $end = $endParam
            ? Carbon::parse($endParam)->endOfDay()
            : now()->endOfWeek();

        if ($start->gt($end)) {
            [$start, $end] = [$end, $start];
        }

        $query = Timesheet::with(['user:id,name,email', 'entries:id,timesheet_id,duration_minutes'])
            ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()]);

        if (!$user->is_admin) {
            $query->where('user_id', $user->id);
        }

        $timesheets = $query->get();

        $rows = $timesheets
            ->groupBy('user_id')
            ->map(function ($userTimesheets) {
                $user = $userTimesheets->first()->user;

                $days = $userTimesheets
                    ->groupBy(fn ($timesheet) => $timesheet->work_date->toDateString())
                    ->map(function ($dayTimesheets) {
                        $total = $dayTimesheets->sum(function ($timesheet) {
                            $entryTotal = $timesheet->entries->sum('duration_minutes');
                            if ($entryTotal === 0 && $timesheet->total_minutes) {
                                return $timesheet->total_minutes;
                            }
                            return $entryTotal;
                        });

                        return [
                            'date' => $dayTimesheets->first()->work_date->toDateString(),
                            'total_minutes' => $total,
                        ];
                    })
                    ->values()
                    ->all();

                $totalMinutes = collect($days)->sum('total_minutes');

                return [
                    'user' => $user
                        ? [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                        ]
                        : null,
                    'total_minutes' => $totalMinutes,
                    'days' => $days,
                ];
            })
            ->values()
            ->all();

        if ($request->query('format') === 'csv') {
            $csvLines = ['User,Email,Date,Total Minutes'];
            foreach ($rows as $row) {
                foreach ($row['days'] as $day) {
                    $csvLines[] = sprintf(
                        '"%s","%s","%s","%s"',
                        $row['user']['name'] ?? 'Unknown',
                        $row['user']['email'] ?? '',
                        $day['date'],
                        $day['total_minutes']
                    );
                }
            }

            $csv = implode("\n", $csvLines) . "\n";

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="report.csv"',
            ]);
        }

        return response()->json([
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'grouping' => 'user',
            'rows' => $rows,
        ]);
    }
}
