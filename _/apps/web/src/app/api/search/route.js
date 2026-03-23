import sql from "@/app/api/utils/sql";

// Advanced search across videos and channels
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, videos, channels
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
      return Response.json(
        {
          success: false,
          error: "Search query required",
        },
        { status: 400 },
      );
    }

    const results = { videos: [], channels: [] };

    // Search videos
    if (type === "all" || type === "videos") {
      const videos = await sql(
        `
        SELECT 
          v.*,
          c.name as channel_name,
          c.avatar_url as channel_avatar,
          c.is_verified as channel_verified
        FROM videos v
        JOIN channels c ON v.channel_id = c.id
        WHERE v.status = 'published'
          AND (
            LOWER(v.title) LIKE LOWER($1)
            OR LOWER(v.description) LIKE LOWER($1)
            OR v.id IN (SELECT video_id FROM video_tags WHERE LOWER(tag) LIKE LOWER($1))
          )
        ORDER BY v.views_count DESC
        LIMIT $2
      `,
        [`%${query}%`, limit],
      );

      results.videos = videos;
    }

    // Search channels
    if (type === "all" || type === "channels") {
      const channels = await sql(
        `
        SELECT c.*, u.username
        FROM channels c
        JOIN users u ON c.user_id = u.id
        WHERE LOWER(c.name) LIKE LOWER($1)
          OR LOWER(c.description) LIKE LOWER($1)
        ORDER BY c.subscribers_count DESC
        LIMIT $2
      `,
        [`%${query}%`, limit],
      );

      results.channels = channels;
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error("Error searching:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
