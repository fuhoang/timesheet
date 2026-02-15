<?php

namespace Tests\Feature;

use App\Models\Timesheet;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimesheetSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_incomplete_week_is_seeded_as_draft_only(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-02-10 10:00:00'));

        $this->seed([
            \Database\Seeders\UserSeeder::class,
            \Database\Seeders\ProjectSeeder::class,
            \Database\Seeders\TimesheetSeeder::class,
        ]);

        $start = now()->startOfWeek()->toDateString();
        $end = now()->endOfWeek()->toDateString();

        $nonDraftCount = Timesheet::query()
            ->whereBetween('work_date', [$start, $end])
            ->where('status', '!=', 'draft')
            ->count();

        $submittedCount = Timesheet::query()
            ->whereBetween('work_date', [$start, $end])
            ->whereNotNull('submitted_at')
            ->count();

        $this->assertSame(0, $nonDraftCount);
        $this->assertSame(0, $submittedCount);

        Carbon::setTestNow();
    }
}

