<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Timesheet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'work_date',
        'total_minutes',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'work_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    /* ---------------- Relationships ---------------- */

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

    public function isLocked()
    {
        return in_array($this->status, [
            'submitted',
            'approved',
        ]);
    }
}
