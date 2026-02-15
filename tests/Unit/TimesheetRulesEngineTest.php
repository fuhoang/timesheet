<?php

namespace Tests\Unit;

use App\Models\Timesheet;
use App\Services\TimesheetRulesEngine;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class TimesheetRulesEngineTest extends TestCase
{
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
}
