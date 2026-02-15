<?php

namespace Tests\Unit;

use App\Models\Timesheet;
use App\Services\TimesheetRulesEngine;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class TimesheetRulesEngineTest extends TestCase
{
    private function makeTimesheet(string $status, ?string $submittedAt = null, ?string $approvedAt = null): Timesheet
    {
        $timesheet = new Timesheet();
        $timesheet->setRawAttributes([
            'status' => $status,
            'submitted_at' => $submittedAt,
            'approved_at' => $approvedAt,
        ], true);

        return $timesheet;
    }

    public function test_incomplete_week_is_not_submittable_and_not_locked(): void
    {
        $engine = new TimesheetRulesEngine();
        $timesheets = new Collection([
            new Timesheet(['status' => 'submitted']),
        ]);

        $result = $engine->evaluateWeek(
            $timesheets,
            Carbon::parse('2026-02-15'),
            Carbon::parse('2026-02-10 10:00:00')
        );

        $this->assertFalse($result['week_complete']);
        $this->assertFalse($result['locked']);
        $this->assertFalse($result['can_submit']);
        $this->assertSame('week_in_progress', $result['submit_blocked_reason']);
    }

    public function test_completed_week_with_submitted_day_is_locked(): void
    {
        $engine = new TimesheetRulesEngine();
        $timesheets = new Collection([
            new Timesheet(['status' => 'submitted']),
        ]);

        $result = $engine->evaluateWeek(
            $timesheets,
            Carbon::parse('2026-02-08'),
            Carbon::parse('2026-02-10 10:00:00')
        );

        $this->assertTrue($result['week_complete']);
        $this->assertTrue($result['locked']);
        $this->assertFalse($result['can_submit']);
        $this->assertSame('already_submitted_or_reviewed', $result['submit_blocked_reason']);
    }

    public function test_approved_timesheet_is_not_editable(): void
    {
        $engine = new TimesheetRulesEngine();
        $timesheet = new Timesheet(['status' => 'approved']);

        $result = $engine->evaluateTimesheetEdit($timesheet);

        $this->assertFalse($result['allowed']);
        $this->assertSame('approved_locked', $result['reason']);
    }

    public function test_admin_approve_rule_blocks_already_approved(): void
    {
        $engine = new TimesheetRulesEngine();
        $timesheet = new Timesheet([
            'status' => 'approved',
        ]);

        $result = $engine->evaluateAdminApprove($timesheet);

        $this->assertFalse($result['allowed']);
        $this->assertSame('already_approved', $result['reason']);
    }

    public function test_admin_transition_matrix_rules(): void
    {
        $engine = new TimesheetRulesEngine();

        $rows = [
            [
                'label' => 'draft without submitted_at',
                'timesheet' => $this->makeTimesheet('draft'),
                'approve' => ['allowed' => false, 'reason' => 'not_submitted'],
                'reject' => ['allowed' => false, 'reason' => 'not_submitted'],
                'unlock' => ['allowed' => false, 'reason' => 'already_unlocked'],
            ],
            [
                'label' => 'draft with submitted_at',
                'timesheet' => $this->makeTimesheet('draft', '2026-02-01 10:00:00'),
                'approve' => ['allowed' => true, 'reason' => null],
                'reject' => ['allowed' => true, 'reason' => null],
                'unlock' => ['allowed' => true, 'reason' => null],
            ],
            [
                'label' => 'submitted',
                'timesheet' => $this->makeTimesheet('submitted', '2026-02-01 10:00:00'),
                'approve' => ['allowed' => true, 'reason' => null],
                'reject' => ['allowed' => true, 'reason' => null],
                'unlock' => ['allowed' => true, 'reason' => null],
            ],
            [
                'label' => 'rejected but submitted',
                'timesheet' => $this->makeTimesheet('rejected', '2026-02-01 10:00:00'),
                'approve' => ['allowed' => true, 'reason' => null],
                'reject' => ['allowed' => true, 'reason' => null],
                'unlock' => ['allowed' => true, 'reason' => null],
            ],
            [
                'label' => 'approved',
                'timesheet' => $this->makeTimesheet('approved', '2026-02-01 10:00:00', '2026-02-01 12:00:00'),
                'approve' => ['allowed' => false, 'reason' => 'already_approved'],
                'reject' => ['allowed' => false, 'reason' => 'already_approved'],
                'unlock' => ['allowed' => true, 'reason' => null],
            ],
        ];

        foreach ($rows as $row) {
            $approve = $engine->evaluateAdminApprove($row['timesheet']);
            $reject = $engine->evaluateAdminReject($row['timesheet']);
            $unlock = $engine->evaluateAdminUnlock($row['timesheet']);

            $this->assertSame($row['approve']['allowed'], $approve['allowed'], $row['label'].' approve allowed');
            $this->assertSame($row['approve']['reason'], $approve['reason'], $row['label'].' approve reason');

            $this->assertSame($row['reject']['allowed'], $reject['allowed'], $row['label'].' reject allowed');
            $this->assertSame($row['reject']['reason'], $reject['reason'], $row['label'].' reject reason');

            $this->assertSame($row['unlock']['allowed'], $unlock['allowed'], $row['label'].' unlock allowed');
            $this->assertSame($row['unlock']['reason'], $unlock['reason'], $row['label'].' unlock reason');
        }
    }
}
