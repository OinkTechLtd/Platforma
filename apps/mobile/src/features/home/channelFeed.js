const PUBLIC_CHANNELS_ENDPOINT = 'https://aqeleulwobgamdffkfri.supabase.co/functions/v1/public-channels';
const ORIGINAL_CHANNELS = new Set(['oinktech', 'twixoff', 'твканалы', 'tvkanaly']);
const TOPIC_KEYWORDS = {
  technology: ['tech', 'ai', 'dev', 'code', 'gadget', 'digital', 'startup'],
  music: ['music', 'dj', 'remix', 'sound', 'beat', 'artist'],
  gaming: ['game', 'stream', 'esports', 'play', 'gaming'],
  news: ['news', 'live', 'report', 'world', 'daily', 'update', 'tv', 'канал'],
  education: ['edu', 'learn', 'school', 'study', 'science', 'tutorial'],
  lifestyle: ['life', 'travel', 'vlog', 'beauty', 'food', 'fashion'],
};
const SPAM_PATTERNS = [
  /casino/i,
  /crypto\s*signal/i,
  /airdrop/i,
  /give\s*away/i,
  /onlyfans/i,
  /18\+/i,
  /xxx/i,
  /bet/i,
  /free\s*money/i,
  /pump/i,
  /dropship/i,
];

function pickFirst(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (Array.isArray(value?.channels)) {
    return value.channels;
  }
  if (Array.isArray(value?.data)) {
    return value.data;
  }
  if (Array.isArray(value?.items)) {
    return value.items;
  }
  if (Array.isArray(value?.results)) {
    return value.results;
  }
  return [];
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function formatCount(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Новый канал';
  }
  if (numeric >= 1000000) {
    return `${(numeric / 1000000).toFixed(1)}M`;
  }
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(1)}K`;
  }
  return `${numeric}`;
}

function inferTopic(channel) {
  const searchable = `${channel.name} ${channel.handle} ${channel.description} ${channel.language}`.toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((keyword) => searchable.includes(keyword))) {
      return topic;
    }
  }
  return 'technology';
}

function normalizeChannel(rawChannel, index) {
  const name = pickFirst(rawChannel.name, rawChannel.title, rawChannel.channel_name, rawChannel.username);
  const handle = pickFirst(rawChannel.handle, rawChannel.slug, rawChannel.username, rawChannel.channel_username);
  const description = pickFirst(rawChannel.description, rawChannel.bio, rawChannel.summary, rawChannel.about);
  const avatarUrl = pickFirst(
    rawChannel.avatar_url,
    rawChannel.avatarUrl,
    rawChannel.image,
    rawChannel.photo_url,
    rawChannel.photoUrl,
    rawChannel.thumbnail,
  );
  const category = pickFirst(rawChannel.category, rawChannel.topic, rawChannel.genre);
  const id = String(rawChannel.id ?? rawChannel.channel_id ?? handle ?? name ?? `channel-${index}`);
  const language = pickFirst(rawChannel.language, rawChannel.locale, rawChannel.lang, 'ru');
  const subscribersCount = Number(
    rawChannel.subscribers_count ?? rawChannel.subscribers ?? rawChannel.followers_count ?? rawChannel.followers ?? 0
  );
  const isVerified = Boolean(rawChannel.verified ?? rawChannel.is_verified ?? rawChannel.isOfficial);

  const normalized = {
    id,
    name: name || `Канал ${index + 1}`,
    handle: handle ? `@${handle.replace(/^@/, '')}` : '',
    description,
    avatarUrl,
    category: category || '',
    subscribersCount,
    language,
    isVerified,
    rawChannel,
  };

  return {
    ...normalized,
    category: normalized.category || inferTopic(normalized),
    subscriberLabel: formatCount(subscribersCount),
    normalizedKey: normalizeText(handle || name || id),
  };
}

function looksLikeTrash(channel) {
  const normalizedName = normalizeText(channel.name);
  const normalizedHandle = normalizeText(channel.handle);
  const searchable = `${channel.name} ${channel.handle} ${channel.description}`;
  const merged = normalizeText(searchable);

  if (ORIGINAL_CHANNELS.has(normalizedName) || ORIGINAL_CHANNELS.has(normalizedHandle)) {
    return false;
  }

  if (!channel.name || merged.length < 3) {
    return true;
  }

  if (SPAM_PATTERNS.some((pattern) => pattern.test(searchable))) {
    return true;
  }

  if (/([a-zа-я])\1{4,}/i.test(searchable)) {
    return true;
  }

  const digitsAndSymbols = searchable.replace(/[\p{L}\s]/gu, '');
  if (digitsAndSymbols.length > searchable.length * 0.45 && searchable.length > 10) {
    return true;
  }

  if ((normalizedName.includes('oinktech') || normalizedName.includes('twixoff') || normalizedName.includes('твканалы'))
    && !ORIGINAL_CHANNELS.has(normalizedName)) {
    return true;
  }

  return false;
}

function selectPreferredChannel(current, candidate) {
  const currentScore = (current.isVerified ? 4 : 0)
    + (current.subscribersCount > 0 ? 2 : 0)
    + (current.description.length > 20 ? 1 : 0);
  const candidateScore = (candidate.isVerified ? 4 : 0)
    + (candidate.subscribersCount > 0 ? 2 : 0)
    + (candidate.description.length > 20 ? 1 : 0);
  return candidateScore > currentScore ? candidate : current;
}

export async function fetchPublicChannels() {
  const response = await fetch(PUBLIC_CHANNELS_ENDPOINT, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить каналы: ${response.status}`);
  }

  const payload = await response.json();
  const entries = toArray(payload);
  const uniqueChannels = new Map();

  entries
    .map((entry, index) => normalizeChannel(entry, index))
    .filter((channel) => !looksLikeTrash(channel))
    .forEach((channel) => {
      const key = channel.normalizedKey || channel.id;
      const existing = uniqueChannels.get(key);
      uniqueChannels.set(key, existing ? selectPreferredChannel(existing, channel) : channel);
    });

  return Array.from(uniqueChannels.values())
    .sort((left, right) => {
      if (left.isVerified !== right.isVerified) {
        return Number(right.isVerified) - Number(left.isVerified);
      }
      return right.subscribersCount - left.subscribersCount;
    });
}

function seededScore(seed) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
}

export function buildRecommendationBuckets(channels, preferences, viewerId) {
  const hiddenIds = new Set(preferences.hiddenChannelIds);
  const subscribedIds = new Set(preferences.subscribedChannelIds);
  const watchedCategories = Object.values(preferences.watchHistory)
    .map((entry) => entry?.category)
    .filter(Boolean);
  const favoriteTopics = new Set([
    ...preferences.preferredTopics,
    ...watchedCategories,
  ]);

  const visibleChannels = channels.filter((channel) => !hiddenIds.has(channel.id));

  const scored = visibleChannels.map((channel) => {
    const seededAffinity = seededScore(`${viewerId}:${channel.id}`);
    const topicMatch = favoriteTopics.has(channel.category) ? 4 : 0;
    const subscribedBoost = subscribedIds.has(channel.id) ? 3 : 0;
    const historyBoost = Object.values(preferences.watchHistory).some((entry) => entry?.category === channel.category) ? 2 : 0;
    const verifiedBoost = channel.isVerified ? 1.5 : 0;
    const popularityBoost = Math.min(channel.subscribersCount / 50000, 2);
    const total = seededAffinity + topicMatch + subscribedBoost + historyBoost + verifiedBoost + popularityBoost;

    let reason = 'Стабильно залетает в твою ленту';
    if (subscribedBoost) {
      reason = 'Уже в твоих подписках';
    } else if (topicMatch) {
      reason = `Похоже на твой интерес: ${channel.category}`;
    } else if (historyBoost) {
      reason = 'Схоже с тем, что ты уже смотришь';
    }

    return {
      ...channel,
      recommendationScore: total,
      recommendationReason: reason,
    };
  });

  const recommended = [...scored].sort((a, b) => b.recommendationScore - a.recommendationScore);
  const originals = recommended.filter((channel) => ORIGINAL_CHANNELS.has(normalizeText(channel.name)) || ORIGINAL_CHANNELS.has(normalizeText(channel.handle)));
  const subscriptions = recommended.filter((channel) => subscribedIds.has(channel.id));
  const discover = recommended.filter((channel) => !subscribedIds.has(channel.id));

  return {
    recommended,
    originals,
    subscriptions,
    discover,
  };
}

export const availableTopics = Object.keys(TOPIC_KEYWORDS);
