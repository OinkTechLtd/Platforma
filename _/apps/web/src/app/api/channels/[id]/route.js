import sql from "@/app/api/utils/sql";

// Get channel details
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql(
      `
      SELECT c.*, u.username, u.email
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `,
      [id],
    );

    if (result.length === 0) {
      return Response.json(
        { success: false, error: "Channel not found" },
        { status: 404 },
      );
    }

    const channel = result[0];

    // Get video count
    const videoCount = await sql(
      `
      SELECT COUNT(*) as count FROM videos WHERE channel_id = $1
    `,
      [id],
    );
    channel.videos_count = parseInt(videoCount[0].count);

    return Response.json({ success: true, channel });
  } catch (error) {
    console.error("Error fetching channel:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Update channel
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, avatarUrl, bannerUrl } = body;

    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (avatarUrl !== undefined) {
      paramCount++;
      updates.push(`avatar_url = $${paramCount}`);
      values.push(avatarUrl);
    }
    if (bannerUrl !== undefined) {
      paramCount++;
      updates.push(`banner_url = $${paramCount}`);
      values.push(bannerUrl);
    }

    if (updates.length > 0) {
      paramCount++;
      values.push(id);

      await sql(
        `UPDATE channels SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        values,
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating channel:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
