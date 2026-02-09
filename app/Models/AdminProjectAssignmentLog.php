<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminProjectAssignmentLog extends Model
{
    protected $fillable = [
        'admin_id',
        'user_id',
        'before_project_ids',
        'after_project_ids',
    ];

    protected $casts = [
        'before_project_ids' => 'array',
        'after_project_ids' => 'array',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
