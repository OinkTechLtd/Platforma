import sql from "@/app/api/utils/sql";

// Track video view
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, watchDuration, completed } = body;

    // Record view
    await sql(
      `
      INSERT INTO views (video_id, user_id, watch_duration, completed)
      VALUES ($1, $2, $3, $4)
    `,
      [id, userId || null, watchDuration || 0, completed || false],
    );

    // Update video views count
    await sql(
      `
      UPDATE videos 
      SET views_count = views_count + 1 
      WHERE id = $1
    `,
      [id],
    );

    // Add to watch history if user is logged in
    if (userId) {
      await sql(
        `
        INSERT INTO watch_history (user_id, video_id, watch_duration)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `,
        [userId, id, watchDuration || 0],
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
