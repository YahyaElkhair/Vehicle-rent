<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    /**
     * Display a listing of the comments (optional pagination).
     */
    public function index()
    {
        $comments = Comment::with(['user', 'post'])
            ->latest()
            ->paginate(10);

        return response()->json($comments);
    }

    /**
     * Store a newly created comment.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'nullable|string|max:1000',
            'post_id' => 'required|exists:posts,id',
            'rating' => 'required|integer|between:1,5'
        ]);

        $validated['user_id'] = $request->user()->id;
        $comment = Comment::create($validated);

        // Update post rating stats
        $post = Post::find($validated['post_id']);
        $post->updateRatingStats();

        return response()->json([
            'message' => 'Review submitted successfully',
            'comment' => $comment->load('user')
        ], 201);
    }

    /**
     * Display a single comment.
     */
    public function show(Comment $comment)
    {
        return response()->json($comment->load('user', 'post'));
    }

    /**
     * Update a comment (only the owner).
     */
    public function update(Request $request, Comment $comment)
    {

        // if ($request->user()->id !== $comment->user_id) {
        //     return response()->json(['error' => 'Unauthorized'], 403);
        // }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment->update($validated);

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment
        ]);
    }

    /**
     * Soft-delete a comment (only the owner).
     */
    public function destroy(Request $request, Comment $comment)
    {
        // Get post before deleting comment
        $post = $comment->post;

        $comment->delete();

        // Update rating stats
        $post->updateRatingStats();

        return response()->json([
            'message' => 'Comment deleted successfully'
        ]);
    }
}
