"use client";

import { useEffect, useState } from "react";
import { Search, Menu, Upload, User } from "lucide-react";
import VideoGrid from "@/components/VideoGrid";

export default function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("trending");

  useEffect(() => {
    fetchVideos();
  }, [sortBy]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos?sort=${sortBy}&limit=24`);
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchVideos();
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=videos`,
      );
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#272727]">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#272727] rounded-full transition-colors">
              <Menu size={24} color="#fff" />
            </button>
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-white text-xl">
                П
              </div>
              <span className="text-white text-xl font-semibold hidden sm:block">
                Платформа
              </span>
              <span className="text-[#aaa] text-xs hidden md:block">
                by StreamLiveTV
              </span>
            </a>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl mx-8 hidden md:flex"
          >
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[#121212] border border-[#303030] rounded-l-full px-6 py-2 text-white placeholder-[#aaa] focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-[#222] border border-[#303030] border-l-0 rounded-r-full px-6 hover:bg-[#2a2a2a] transition-colors"
              >
                <Search size={20} color="#fff" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <a
              href="/upload"
              className="p-2 hover:bg-[#272727] rounded-full transition-colors"
            >
              <Upload size={24} color="#fff" />
            </a>
            <button className="p-2 hover:bg-[#272727] rounded-full transition-colors">
              <User size={24} color="#fff" />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="px-4 pb-2 md:hidden">
          <div className="flex">
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#121212] border border-[#303030] rounded-l-full px-4 py-2 text-white placeholder-[#aaa] focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-[#222] border border-[#303030] border-l-0 rounded-r-full px-4 hover:bg-[#2a2a2a] transition-colors"
            >
              <Search size={18} color="#fff" />
            </button>
          </div>
        </form>
      </header>

      {/* Filters */}
      <div className="sticky top-[73px] md:top-[57px] z-40 bg-[#0f0f0f] border-b border-[#272727] px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {["trending", "recent", "popular"].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                sortBy === sort
                  ? "bg-white text-black"
                  : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
              }`}
            >
              {sort === "trending"
                ? "В тренде"
                : sort === "recent"
                  ? "Новые"
                  : "Популярные"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-4 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[#272727] aspect-video rounded-xl mb-3"></div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-[#272727] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#272727] rounded mb-2"></div>
                    <div className="h-3 bg-[#272727] rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center text-[#aaa] py-20">
            <p className="text-xl">Видео не найдены</p>
          </div>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </main>
    </div>
  );
}
