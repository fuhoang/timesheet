<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminSystemOperationLog extends Model
{
    protected $fillable = [
        'admin_id',
        'action',
        'affected_count',
        'dry_run',
        'request_id',
        'context',
    ];

    protected $casts = [
        'dry_run' => 'boolean',
        'context' => 'array',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}

