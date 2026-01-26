<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;

Schedule::command('timers:auto-stop-midnight')
    ->dailyAt('00:00')
    ->withoutOverlapping();

