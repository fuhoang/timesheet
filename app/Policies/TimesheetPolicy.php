<?php

namespace App\Policies;

use App\Models\Timesheet;
use App\Models\User;

class TimesheetPolicy
{
    /* -------------------------------------------------
     | USER ACTIONS
     |------------------------------------------------- */


    /**
     * Admin can do everything
     */
    public function before(User $user)
    {
        if ($user->is_admin) {
            return true;
        }
    }



    /**
     * View a timesheet
     */
    public function view(User $user, Timesheet $timesheet): bool
    {
        return $user->id === $timesheet->user_id;
    }

    /**
     * Create time entries on a timesheet
     */
    public function update(User $user, Timesheet $timesheet): bool
    {
        return $timesheet->user_id === $user->id
            && in_array($timesheet->status, ['draft', 'rejected']);
    }

    /**
     * Start / stop timer
     * (alias of update, but explicit for clarity)
     */
    public function trackTime(User $user, Timesheet $timesheet): bool
    {
        return $this->update($user, $timesheet);
    }

    /**
     * Submit a week
     */
    public function submit(User $user, Timesheet $timesheet): bool
    {
        return
            $user->id === $timesheet->user_id &&
            $timesheet->isDraft() &&
            $timesheet->total_minutes > 0;
    }

    /* -------------------------------------------------
     | ADMIN ACTIONS
     |------------------------------------------------- */

    /**
     * Admin can view all timesheets
     */
    public function viewAny(User $user): bool
    {
        return $user->is_admin;
    }

    /**
     * Approve a submitted timesheet
     */
    public function approve(User $user, Timesheet $timesheet): bool
    {
        return
            $user->is_admin &&
            $timesheet->isSubmitted();
    }

    /**
     * Reject a submitted timesheet
     */
    public function reject(User $user, Timesheet $timesheet): bool
    {
        return
            $user->is_admin &&
            $timesheet->isSubmitted();
    }

    /**
     * Force unlock (optional admin override)
     */
    public function unlock(User $user, Timesheet $timesheet): bool
    {
        return $user->is_admin;
    }

    /* -------------------------------------------------
     | DESTRUCTIVE ACTIONS
     |------------------------------------------------- */

    /**
     * Deleting timesheets is usually forbidden
     */
    public function delete(User $user, Timesheet $timesheet): bool
    {
        return false;
    }
}
