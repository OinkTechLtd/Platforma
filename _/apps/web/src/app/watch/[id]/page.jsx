"use client";

import { useEffect, useState, useRef } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Flag,
  ChevronDown,
  Send,
} from "lucide-react";

function formatViews(views) {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffMs / 2592000000);
  const diffYears = Math.floor(diffMs / 31536000000);

  if (diffYears > 0)
    return `${diffYears} ${diffYears === 1 ? "год" : "лет"} назад`;
  if (diffMonths > 0)
    return `${diffMonths} ${diffMonths === 1 ? "месяц" : "месяцев"} назад`;
  if (diffDays > 0)
    return `${diffDays} ${diffDays === 1 ? "день" : "дней"} назад`;
  return "сегодня";
}

export default function WatchPage({ params }) {
  const { id } = params;
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(null);
  const [commentText, setCommentText] = useState("");
  const videoRef = useRef(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      fetchRelatedVideos();
    }
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${id}`);
      const data = await response.json();
      if (data.success) {
        setVideo(data.video);
      }
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/videos/${id}/comments`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchRelatedVideos = async () => {
    try {
      const response = await fetch("/api/videos?sort=trending&limit=12");
      const data = await response.json();
      if (data.success) {
        setRelatedVideos(data.videos.filter((v) => v.id !== id));
      }
    } catch (error) {
      console.error("Error fetching related videos:", error);
    }
  };

  const trackView = async () => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    try {
      await fetch(`/api/videos/${id}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null, watchDuration: 0 }),
      });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleLike = async (isLike) => {
    const demoUserId = "11111111-1111-1111-1111-111111111111";
    try {
      await fetch(`/api/videos/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoUserId, isLike }),
      });
      setLiked(liked === isLike ? null : isLike);
      fetchVideo();
    } catch (error) {
      console.error("Error liking video:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!video) return;
    const demoUserId = "11111111-1111-1111-1111-111111111111";
    try {
      await fetch(`/api/channels/${video.channel_id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoUserId }),
      });
      setSubscribed(!subscribed);
      fetchVideo();
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const demoUserId = "11111111-1111-1111-1111-111111111111";
    try {
      const response = await fetch(`/api/videos/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: demoUserId, content: commentText }),
      });

      if (response.ok) {
        setCommentText("");
        fetchComments();
        fetchVideo();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-white text-xl">Видео не найдено</div>
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

      <div className="max-w-[1920px] mx-auto lg:flex gap-6 p-4 lg:p-6">
        {/* Main Content */}
        <div className="flex-1 max-w-[1280px]">
          {/* Video Player */}
          <div className="bg-black aspect-video rounded-xl overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={video.video_url}
              controls
              autoPlay
              onPlay={trackView}
              className="w-full h-full"
            />
          </div>

          {/* Video Info */}
          <div className="mb-4">
            <h1 className="text-white text-xl font-semibold mb-3">
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Channel Info */}
              <div className="flex items-center gap-4">
                <img
                  src={
                    video.channel_avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.channel_name}`
                  }
                  alt={video.channel_name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/channel/${video.channel_id}`}
                      className="text-white font-medium hover:text-[#aaa]"
                    >
                      {video.channel_name}
                    </a>
                    {video.channel_verified && (
                      <svg
                        className="w-4 h-4 text-[#aaa]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#aaa] text-xs">
                    {formatViews(video.channel_subscribers)} подписчиков
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  className={`ml-4 px-6 py-2 rounded-full font-medium transition-colors ${
                    subscribed
                      ? "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                      : "bg-white text-black hover:bg-[#d9d9d9]"
                  }`}
                >
                  {subscribed ? "Вы подписаны" : "Подписаться"}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="flex bg-[#272727] rounded-full overflow-hidden">
                  <button
                    onClick={() => handleLike(true)}
                    className={`flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] transition-colors ${
                      liked === true ? "text-blue-500" : "text-white"
                    }`}
                  >
                    <ThumbsUp size={20} />
                    <span className="text-sm font-medium">
                      {formatViews(video.likes_count)}
                    </span>
                  </button>
                  <div className="w-px bg-[#3f3f3f]"></div>
                  <button
                    onClick={() => handleLike(false)}
                    className={`px-4 py-2 hover:bg-[#3f3f3f] transition-colors ${
                      liked === false ? "text-blue-500" : "text-white"
                    }`}
                  >
                    <ThumbsDown size={20} />
                  </button>
                </div>

                <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] text-white px-4 py-2 rounded-full transition-colors">
                  <Share2 size={20} />
                  <span className="text-sm font-medium hidden sm:inline">
                    Поделиться
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#272727] rounded-xl p-4 mb-4">
            <p className="text-white text-sm font-medium mb-2">
              {formatViews(video.views_count)} просмотров •{" "}
              {formatTimeAgo(video.created_at)}
            </p>
            <p
              className={`text-white text-sm ${showFullDescription ? "" : "line-clamp-2"}`}
            >
              {video.description || "Нет описания"}
            </p>
            {video.description && video.description.length > 100 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-white font-medium text-sm mt-2 hover:text-[#aaa]"
              >
                {showFullDescription ? "Свернуть" : "Показать полностью"}
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="mb-8">
            <h2 className="text-white text-xl font-semibold mb-6">
              {video.comments_count} комментариев
            </h2>

            {/* Add Comment */}
            <form onSubmit={handleComment} className="flex gap-4 mb-8">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
                alt="User"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Введите комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-transparent border-b border-[#3f3f3f] text-white pb-2 focus:outline-none focus:border-white transition-colors"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCommentText("")}
                    className="px-4 py-2 text-white hover:bg-[#272727] rounded-full transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <img
                    src={
                      comment.user_avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`
                    }
                    alt={comment.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">
                        {comment.username}
                      </span>
                      <span className="text-[#aaa] text-xs">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-white text-sm mb-2">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-[#aaa] hover:text-white transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-xs">
                          {comment.likes_count || 0}
                        </span>
                      </button>
                      <button className="text-[#aaa] hover:text-white text-xs font-medium transition-colors">
                        Ответить
                      </button>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-4">
                            <img
                              src={
                                reply.user_avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.username}`
                              }
                              alt={reply.username}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-sm font-medium">
                                  {reply.username}
                                </span>
                                <span className="text-[#aaa] text-xs">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-white text-sm">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Videos */}
        <div className="lg:w-[402px] space-y-3">
          <h2 className="text-white font-semibold mb-4 hidden lg:block">
            Рекомендуем
          </h2>
          {relatedVideos.map((relVideo) => (
            <a
              key={relVideo.id}
              href={`/watch/${relVideo.id}`}
              className="flex gap-2 group"
            >
              <div className="relative w-[168px] aspect-video bg-[#272727] rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={
                    relVideo.thumbnail_url ||
                    `https://picsum.photos/seed/${relVideo.id}/336/189`
                  }
                  alt={relVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
                  {relVideo.title}
                </h3>
                <p className="text-[#aaa] text-xs mb-0.5">
                  {relVideo.channel_name}
                </p>
                <p className="text-[#aaa] text-xs">
                  {formatViews(relVideo.views_count)} просмотров •{" "}
                  {formatTimeAgo(relVideo.created_at)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
