import sql from "@/app/api/utils/sql";

// Get videos list with recommendations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const channelId = searchParams.get("channelId");
    const sort = searchParams.get("sort") || "trending"; // trending, recent, popular
    const limit = parseInt(searchParams.get("limit") || "24");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = `
      SELECT 
        v.*,
        c.name as channel_name,
        c.avatar_url as channel_avatar,
        c.is_verified as channel_verified,
        c.subscribers_count as channel_subscribers
      FROM videos v
      JOIN channels c ON v.channel_id = c.id
      WHERE v.status = 'published'
    `;

    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (LOWER(v.title) LIKE LOWER($${paramCount}) OR LOWER(v.description) LIKE LOWER($${paramCount}))`;
      params.push(`%${search}%`);
    }

    if (tag) {
      paramCount++;
      query += ` AND v.id IN (SELECT video_id FROM video_tags WHERE tag = $${paramCount})`;
      params.push(tag);
    }

    if (channelId) {
      paramCount++;
      query += ` AND v.channel_id = $${paramCount}`;
      params.push(channelId);
    }

    // Sorting algorithms
    if (sort === "trending") {
      query += ` ORDER BY (v.views_count * 0.3 + v.likes_count * 0.7) / EXTRACT(EPOCH FROM (NOW() - v.created_at)) DESC`;
    } else if (sort === "recent") {
      query += ` ORDER BY v.created_at DESC`;
    } else if (sort === "popular") {
      query += ` ORDER BY v.views_count DESC`;
    }

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const videos = await sql(query, params);

    return Response.json({
      success: true,
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// Upload new video
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      channelId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      tags,
    } = body;

    if (!channelId || !title || !videoUrl) {
      return Response.json(
        {
          success: false,
          error: "Missing required fields: channelId, title, videoUrl",
        },
        { status: 400 },
      );
    }

    const result = await sql(
      `
      INSERT INTO videos (channel_id, title, description, video_url, thumbnail_url, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [
        channelId,
        title,
        description || "",
        videoUrl,
        thumbnailUrl || null,
        duration || 0,
      ],
    );

    const video = result[0];

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await sql(
          `
          INSERT INTO video_tags (video_id, tag)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
          [video.id, tag.toLowerCase()],
        );
      }
    }

    return Response.json({ success: true, video });
  } catch (error) {
    console.error("Error creating video:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
