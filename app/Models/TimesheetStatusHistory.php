<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimesheetStatusHistory extends Model
{
    protected $fillable = [
        'timesheet_id',
        'from_status',
        'to_status',
        'actor_id',
        'actor_role',
        'reason',
        'context',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    public function timesheet()
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
