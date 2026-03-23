import sql from "@/app/api/utils/sql";

// Get comments for a video
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const comments = await sql(
      `
      SELECT 
        c.*,
        u.username,
        u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.video_id = $1 AND c.parent_comment_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [id, limit, offset],
    );

    // Get replies for each comment
    for (const comment of comments) {
      const replies = await sql(
        `
        SELECT 
          c.*,
          u.username,
          u.avatar_url as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.parent_comment_id = $1
        ORDER BY c.created_at ASC
      `,
        [comment.id],
      );
      comment.replies = replies;
    }

    return Response.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Add comment
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, content, parentCommentId } = body;

    if (!userId || !content) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: userId, content",
        },
        { status: 400 },
      );
    }

    const result = await sql(
      `
      INSERT INTO comments (video_id, user_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [id, userId, content, parentCommentId || null],
    );

    // Update comments count
    await sql(
      `
      UPDATE videos SET comments_count = comments_count + 1 WHERE id = $1
    `,
      [id],
    );

    const comment = result[0];

    // Get user info
    const user = await sql(
      `
      SELECT username, avatar_url FROM users WHERE id = $1
    `,
      [userId],
    );

    comment.username = user[0].username;
    comment.user_avatar = user[0].avatar_url;

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
