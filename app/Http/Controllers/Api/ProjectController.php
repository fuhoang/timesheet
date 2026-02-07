<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()
            ->projects()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project = Project::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'user_id' => $request->user()->id,
        ]);

        $project->users()->syncWithoutDetaching([$request->user()->id]);

        return response()->json($project, 201);
    }
}
