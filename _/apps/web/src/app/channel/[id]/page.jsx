"use client";

import { useEffect, useState } from "react";
import { Bell, Share2 } from "lucide-react";
import VideoGrid from "@/components/VideoGrid";

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num;
}

export default function ChannelPage({ params }) {
  const { id } = params;
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");

  useEffect(() => {
    if (id) {
      fetchChannel();
      fetchVideos();
    }
  }, [id]);

  const fetchChannel = async () => {
    try {
      const response = await fetch(`/api/channels/${id}`);
      const data = await response.json();
      if (data.success) {
        setChannel(data.channel);
      }
    } catch (error) {
      console.error("Error fetching channel:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch(`/api/videos?channelId=${id}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const handleSubscribe = async () => {
    const demoUserId = "11111111-1111-1111-1111-111111111111";
    try {
      await fetch(`/api/channels/${id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoUserId }),
      });
      setSubscribed(!subscribed);
      fetchChannel();
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Канал не найден</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-[#272727] px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white text-xl">
            П
          </div>
          <span className="text-white text-xl font-semibold">Платформа</span>
          <span className="text-[#aaa] text-xs hidden md:inline">
            by StreamLiveTV
          </span>
        </a>
      </header>

      {/* Banner */}
      <div className="relative w-full h-[200px] md:h-[300px] bg-gradient-to-br from-red-900 to-purple-900">
        {channel.banner_url && (
          <img
            src={channel.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Channel Info */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 py-6 border-b border-[#272727]">
          <img
            src={
              channel.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${channel.name}`
            }
            alt={channel.name}
            className="w-32 h-32 rounded-full border-4 border-[#0f0f0f]"
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-white text-3xl font-bold">{channel.name}</h1>
              {channel.is_verified && (
                <svg
                  className="w-6 h-6 text-[#aaa]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>

            <div className="flex items-center gap-4 text-[#aaa] text-sm mb-3">
              <span>{formatNumber(channel.subscribers_count)} подписчиков</span>
              <span>{channel.videos_count} видео</span>
            </div>

            {channel.description && (
              <p className="text-[#aaa] text-sm max-w-3xl">
                {channel.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubscribe}
              className={`px-6 py-2.5 rounded-full font-medium transition-colors ${
                subscribed
                  ? "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                  : "bg-white text-black hover:bg-[#d9d9d9]"
              }`}
            >
              {subscribed ? (
                <span className="flex items-center gap-2">
                  <Bell size={20} />
                  Подписка оформлена
                </span>
              ) : (
                "Подписаться"
              )}
            </button>

            <button className="p-2.5 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors">
              <Share2 size={20} color="white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#272727]">
          {["videos", "about"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-white"
                  : "text-[#aaa] hover:text-white"
              }`}
            >
              {tab === "videos" ? "Видео" : "О канале"}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="py-6">
          {activeTab === "videos" ? (
            videos.length > 0 ? (
              <VideoGrid videos={videos} />
            ) : (
              <div className="text-center text-[#aaa] py-20">
                <p className="text-xl">На этом канале пока нет видео</p>
              </div>
            )
          ) : (
            <div className="max-w-4xl">
              <div className="bg-[#272727] rounded-xl p-6 mb-6">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Описание
                </h2>
                <p className="text-white">
                  {channel.description || "Нет описания"}
                </p>
              </div>

              <div className="bg-[#272727] rounded-xl p-6">
                <h2 className="text-white text-xl font-semibold mb-4">
                  Статистика
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[#aaa] text-sm mb-1">Подписчиков</p>
                    <p className="text-white text-2xl font-bold">
                      {formatNumber(channel.subscribers_count)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#aaa] text-sm mb-1">Видео</p>
                    <p className="text-white text-2xl font-bold">
                      {channel.videos_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#aaa] text-sm mb-1">Всего просмотров</p>
                    <p className="text-white text-2xl font-bold">
                      {formatNumber(channel.total_views)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
