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
        'submitted',
        'submitted_at',

    ];

    protected $casts = [
        'work_date' => 'date',
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
}
