<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Timesheet extends Model
{
    use HasFactory;

    /* ---------------------------------------------
     | Fillable
     |--------------------------------------------- */

    protected $fillable = [
        'user_id',
        'work_date',
        'total_minutes',

        // workflow
        'status',            // draft | submitted | approved | rejected
        'submitted_at',
        'approved_at',
        'approved_by',
        'rejection_reason',
    ];

    /* ---------------------------------------------
     | Casts
     |--------------------------------------------- */

    protected $casts = [
        'work_date'     => 'date',
        'submitted_at'  => 'datetime',
        'approved_at'   => 'datetime',
    ];

    /* ---------------------------------------------
     | Relationships
     |--------------------------------------------- */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function entries()
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /* ---------------------------------------------
     | Scopes
     |--------------------------------------------- */

    public function scopeForWeek($query, Carbon $date)
    {
        return $query->whereBetween('work_date', [
            $date->copy()->startOfWeek(),
            $date->copy()->endOfWeek(),
        ]);
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'submitted');
    }

    /* ---------------------------------------------
     | Status helpers
     |--------------------------------------------- */

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * 🔒 FINAL LOCK RULE
     * Used everywhere (controllers, policies, UI)
     */
    public function isLocked(): bool
    {
        return in_array($this->status, [
            'submitted',
            'approved',
        ], true);
    }

    /* ---------------------------------------------
     | Workflow actions
     |--------------------------------------------- */

    public function submit(): void
    {
        if ($this->isLocked()) {
            return;
        }

        $this->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);
    }

    public function approve(User $admin): void
    {
        $this->update([
            'status'           => 'approved',
            'approved_at'      => now(),
            'approved_by'      => $admin->id,
            'rejection_reason' => null,
        ]);
    }

    public function reject(User $admin, string $reason): void
    {
        $this->update([
            'status'           => 'rejected',
            'approved_at'      => null,
            'approved_by'      => null,
            'rejection_reason' => $reason,
        ]);
    }

    /* ---------------------------------------------
     | Totals
     |--------------------------------------------- */

    public function recalculateTotal(): void
    {
        $this->update([
            'total_minutes' => $this->entries()->sum('duration_minutes'),
        ]);
    }
}
