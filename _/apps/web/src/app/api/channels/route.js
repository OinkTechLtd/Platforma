import sql from "@/app/api/utils/sql";

// Get channels list
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = `
      SELECT c.*, u.username
      FROM channels c
      JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (LOWER(c.name) LIKE LOWER($${paramCount}) OR LOWER(c.description) LIKE LOWER($${paramCount}))`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY c.subscribers_count DESC`;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const channels = await sql(query, params);

    return Response.json({ success: true, channels });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Create new channel
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, description, avatarUrl, bannerUrl } = body;

    if (!userId || !name) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: userId, name",
        },
        { status: 400 },
      );
    }

    const result = await sql(
      `
      INSERT INTO channels (user_id, name, description, avatar_url, banner_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [userId, name, description || "", avatarUrl || null, bannerUrl || null],
    );

    return Response.json({ success: true, channel: result[0] });
  } catch (error) {
    console.error("Error creating channel:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
