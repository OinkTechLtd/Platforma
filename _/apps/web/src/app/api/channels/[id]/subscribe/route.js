import sql from "@/app/api/utils/sql";

// Subscribe/Unsubscribe to channel
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return Response.json(
        {
          success: false,
          error: "User ID required",
        },
        { status: 400 },
      );
    }

    // Check if already subscribed
    const existing = await sql(
      `
      SELECT * FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2
    `,
      [userId, id],
    );

    if (existing.length > 0) {
      // Unsubscribe
      await sql(
        `DELETE FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2`,
        [userId, id],
      );
      await sql(
        `UPDATE channels SET subscribers_count = GREATEST(subscribers_count - 1, 0) WHERE id = $1`,
        [id],
      );
      return Response.json({ success: true, subscribed: false });
    } else {
      // Subscribe
      await sql(
        `
        INSERT INTO subscriptions (subscriber_id, channel_id)
        VALUES ($1, $2)
      `,
        [userId, id],
      );
      await sql(
        `UPDATE channels SET subscribers_count = subscribers_count + 1 WHERE id = $1`,
        [id],
      );
      return Response.json({ success: true, subscribed: true });
    }
  } catch (error) {
    console.error("Error updating subscription:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Get subscription status
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ success: true, subscribed: false });
    }

    const result = await sql(
      `
      SELECT * FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2
    `,
      [userId, id],
    );

    return Response.json({
      success: true,
      subscribed: result.length > 0,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
