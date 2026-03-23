import sql from "@/app/api/utils/sql";

// Like/Dislike video
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, isLike } = body;

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "User ID required",
        },
        { status: 400 },
      );
    }

    // Check if already liked/disliked
    const existing = await sql(
      `
      SELECT * FROM likes WHERE video_id = $1 AND user_id = $2
    `,
      [id, userId],
    );

    if (existing.length > 0) {
      const currentLike = existing[0];

      if (currentLike.is_like === isLike) {
        // Remove like/dislike
        await sql(`DELETE FROM likes WHERE video_id = $1 AND user_id = $2`, [
          id,
          userId,
        ]);

        if (isLike) {
          await sql(
            `UPDATE videos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1`,
            [id],
          );
        } else {
          await sql(
            `UPDATE videos SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = $1`,
            [id],
          );
        }
      } else {
        // Change from like to dislike or vice versa
        await sql(
          `UPDATE likes SET is_like = $1 WHERE video_id = $2 AND user_id = $3`,
          [isLike, id, userId],
        );

        if (isLike) {
          await sql(
            `
            UPDATE videos 
            SET likes_count = likes_count + 1, dislikes_count = GREATEST(dislikes_count - 1, 0) 
            WHERE id = $1
          `,
            [id],
          );
        } else {
          await sql(
            `
            UPDATE videos 
            SET dislikes_count = dislikes_count + 1, likes_count = GREATEST(likes_count - 1, 0) 
            WHERE id = $1
          `,
            [id],
          );
        }
      }
    } else {
      // New like/dislike
      await sql(
        `
        INSERT INTO likes (video_id, user_id, is_like)
        VALUES ($1, $2, $3)
      `,
        [id, userId, isLike],
      );

      if (isLike) {
        await sql(
          `UPDATE videos SET likes_count = likes_count + 1 WHERE id = $1`,
          [id],
        );
      } else {
        await sql(
          `UPDATE videos SET dislikes_count = dislikes_count + 1 WHERE id = $1`,
          [id],
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating like:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Get user's like status for a video
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ success: true, liked: null });
    }

    const result = await sql(
      `
      SELECT is_like FROM likes WHERE video_id = $1 AND user_id = $2
    `,
      [id, userId],
    );

    return Response.json({
      success: true,
      liked: result.length > 0 ? result[0].is_like : null,
    });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
