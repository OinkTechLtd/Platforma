import sql from "@/app/api/utils/sql";

// Get personalized recommendations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      // Return trending videos for non-logged-in users
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
        ORDER BY (v.views_count * 0.3 + v.likes_count * 0.7) / EXTRACT(EPOCH FROM (NOW() - v.created_at)) DESC
        LIMIT $1
      `,
        [limit],
      );

      return Response.json({ success: true, videos });
    }

    // Get user's watch history tags
    const watchedTags = await sql(
      `
      SELECT DISTINCT vt.tag, COUNT(*) as count
      FROM watch_history wh
      JOIN video_tags vt ON wh.video_id = vt.video_id
      WHERE wh.user_id = $1
      GROUP BY vt.tag
      ORDER BY count DESC
      LIMIT 10
    `,
      [userId],
    );

    // Get subscribed channels
    const subscribedChannels = await sql(
      `
      SELECT channel_id FROM subscriptions WHERE subscriber_id = $1
    `,
      [userId],
    );
    const channelIds = subscribedChannels.map((s) => s.channel_id);

    // Get recently watched videos to exclude
    const recentlyWatched = await sql(
      `
      SELECT video_id FROM watch_history 
      WHERE user_id = $1 
      ORDER BY watched_at DESC 
      LIMIT 50
    `,
      [userId],
    );
    const watchedIds = recentlyWatched.map((w) => w.video_id);

    let videos = [];

    // Algorithm: Mix of subscribed channels (40%), similar tags (40%), and trending (20%)

    // 1. Videos from subscribed channels (40% of limit)
    if (channelIds.length > 0) {
      const subLimit = Math.floor(limit * 0.4);
      const subscribedVideos = await sql(
        `
        SELECT 
          v.*,
          c.name as channel_name,
          c.avatar_url as channel_avatar,
          c.is_verified as channel_verified,
          3 as recommendation_score
        FROM videos v
        JOIN channels c ON v.channel_id = c.id
        WHERE v.channel_id = ANY($1)
          AND v.status = 'published'
          ${watchedIds.length > 0 ? "AND v.id != ALL($2)" : ""}
        ORDER BY v.created_at DESC
        LIMIT $${watchedIds.length > 0 ? 3 : 2}
      `,
        watchedIds.length > 0
          ? [channelIds, watchedIds, subLimit]
          : [channelIds, subLimit],
      );

      videos.push(...subscribedVideos);
    }

    // 2. Videos with similar tags (40% of limit)
    if (watchedTags.length > 0) {
      const tagLimit = Math.floor(limit * 0.4);
      const tags = watchedTags.map((t) => t.tag);

      const tagVideos = await sql(
        `
        SELECT DISTINCT
          v.*,
          c.name as channel_name,
          c.avatar_url as channel_avatar,
          c.is_verified as channel_verified,
          2 as recommendation_score
        FROM videos v
        JOIN channels c ON v.channel_id = c.id
        JOIN video_tags vt ON v.id = vt.video_id
        WHERE vt.tag = ANY($1)
          AND v.status = 'published'
          ${watchedIds.length > 0 ? "AND v.id != ALL($2)" : ""}
          AND v.id NOT IN (SELECT id FROM (${videos.map((_, i) => `SELECT '${videos[i].id}'::uuid as id`).join(" UNION ALL ")}) as watched_vids ${videos.length === 0 ? "WHERE false" : ""})
        ORDER BY (v.views_count * 0.3 + v.likes_count * 0.7) DESC
        LIMIT $${watchedIds.length > 0 ? 3 : 2}
      `,
        watchedIds.length > 0 ? [tags, watchedIds, tagLimit] : [tags, tagLimit],
      );

      videos.push(...tagVideos);
    }

    // 3. Trending videos (remaining to fill limit)
    const remainingLimit = limit - videos.length;
    if (remainingLimit > 0) {
      const excludeIds = [...watchedIds, ...videos.map((v) => v.id)];

      const trendingVideos = await sql(
        `
        SELECT 
          v.*,
          c.name as channel_name,
          c.avatar_url as channel_avatar,
          c.is_verified as channel_verified,
          1 as recommendation_score
        FROM videos v
        JOIN channels c ON v.channel_id = c.id
        WHERE v.status = 'published'
          ${excludeIds.length > 0 ? "AND v.id != ALL($1)" : ""}
        ORDER BY (v.views_count * 0.3 + v.likes_count * 0.7) / EXTRACT(EPOCH FROM (NOW() - v.created_at)) DESC
        LIMIT $${excludeIds.length > 0 ? 2 : 1}
      `,
        excludeIds.length > 0 ? [excludeIds, remainingLimit] : [remainingLimit],
      );

      videos.push(...trendingVideos);
    }

    // Shuffle to mix different recommendation types
    videos.sort(() => Math.random() - 0.5);

    return Response.json({ success: true, videos });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
