import { Eye, Clock } from "lucide-react";

function formatViews(views) {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffMs / 2592000000);
  const diffYears = Math.floor(diffMs / 31536000000);

  if (diffYears > 0)
    return `${diffYears} ${diffYears === 1 ? "год" : "лет"} назад`;
  if (diffMonths > 0)
    return `${diffMonths} ${diffMonths === 1 ? "месяц" : "месяцев"} назад`;
  if (diffDays > 0)
    return `${diffDays} ${diffDays === 1 ? "день" : "дней"} назад`;
  if (diffHours > 0)
    return `${diffHours} ${diffHours === 1 ? "час" : "часов"} назад`;
  if (diffMins > 0)
    return `${diffMins} ${diffMins === 1 ? "минуту" : "минут"} назад`;
  return "только что";
}

export default function VideoGrid({ videos }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <a
          key={video.id}
          href={`/watch/${video.id}`}
          className="group cursor-pointer"
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-[#272727] rounded-xl overflow-hidden mb-3">
            <img
              src={
                video.thumbnail_url ||
                "https://picsum.photos/seed/" + video.id + "/640/360"
              }
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex gap-3">
            {/* Channel Avatar */}
            <img
              src={
                video.channel_avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.channel_name}`
              }
              alt={video.channel_name}
              className="w-9 h-9 rounded-full flex-shrink-0"
            />

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm line-clamp-2 mb-1 group-hover:text-[#aaa] transition-colors">
                {video.title}
              </h3>
              <div className="text-[#aaa] text-xs space-y-0.5">
                <p className="flex items-center gap-1">
                  {video.channel_name}
                  {video.channel_verified && (
                    <svg
                      className="w-3 h-3 text-[#aaa]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </p>
                <p className="flex items-center gap-1">
                  {formatViews(video.views_count)} просмотров •{" "}
                  {formatTimeAgo(video.created_at)}
                </p>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
