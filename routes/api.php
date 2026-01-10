<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Protected API route
Route::get('/user', function (Request $request) {
    return response()->json($request->user());
})->middleware(['web', 'auth:sanctum']);
