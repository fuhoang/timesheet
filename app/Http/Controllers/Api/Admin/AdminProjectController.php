<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class AdminProjectController extends Controller
{
    public function index()
    {
        return Project::latest()->get();
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
            'user_id' => $request->user()->id, // ✅ FIX
        ]);

        $project->users()->syncWithoutDetaching([$request->user()->id]);

        return response()->json($project, 201);
    }

    public function update(Request $request, Project $project)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $project->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json($project);
    }


    public function destroy(Project $project)
    {
        $project->delete();

        return response()->noContent();
    }
}
