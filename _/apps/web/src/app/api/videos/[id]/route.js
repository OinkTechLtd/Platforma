import sql from "@/app/api/utils/sql";

// Get single video with details
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql(
      `
      SELECT 
        v.*,
        c.id as channel_id,
        c.name as channel_name,
        c.avatar_url as channel_avatar,
        c.is_verified as channel_verified,
        c.subscribers_count as channel_subscribers,
        c.description as channel_description
      FROM videos v
      JOIN channels c ON v.channel_id = c.id
      WHERE v.id = $1
    `,
      [id],
    );

    if (result.length === 0) {
      return Response.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    const video = result[0];

    // Get tags
    const tags = await sql(
      `
      SELECT tag FROM video_tags WHERE video_id = $1
    `,
      [id],
    );

    video.tags = tags.map((t) => t.tag);

    return Response.json({ success: true, video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Update video
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, description, thumbnailUrl, tags } = body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (thumbnailUrl !== undefined) {
      paramCount++;
      updates.push(`thumbnail_url = $${paramCount}`);
      values.push(thumbnailUrl);
    }

    if (updates.length > 0) {
      paramCount++;
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      await sql(
        `UPDATE videos SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        values,
      );
    }

    // Update tags if provided
    if (tags) {
      await sql(`DELETE FROM video_tags WHERE video_id = $1`, [id]);
      for (const tag of tags) {
        await sql(
          `
          INSERT INTO video_tags (video_id, tag)
          VALUES ($1, $2)
        `,
          [id, tag.toLowerCase()],
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating video:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Delete video
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await sql(`DELETE FROM videos WHERE id = $1`, [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
