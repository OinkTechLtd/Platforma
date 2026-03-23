"use client";

import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
} from "lucide-react";

export default function EmbedPage({ params }) {
  const { id } = params;
  const [video, setVideo] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const controlsTimeout = useRef(null);

  useEffect(() => {
    fetchVideo();
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
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100,
      );
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  if (!video) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={video.video_url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
                {video.title}
              </h1>
              <div className="flex items-center gap-3">
                <img
                  src={
                    video.channel_avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.channel_name}`
                  }
                  alt={video.channel_name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white font-medium drop-shadow-lg">
                  {video.channel_name}
                </span>
              </div>
            </div>
            <a
              href={`/watch/${video.id}`}
              target="_blank"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              Смотреть на Платформе
            </a>
          </div>
        </div>

        {/* Center Play Button */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110"
          >
            <Play size={36} color="white" fill="white" className="ml-1" />
          </button>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Progress Bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-red-600 rounded-full relative group-hover/progress:h-1.5 transition-all"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:scale-110 transition-transform"
              >
                {playing ? <Pause size={28} /> : <Play size={28} />}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:scale-110 transition-transform"
              >
                {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>

              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-white hover:scale-110 transition-transform">
                <Settings size={24} />
              </button>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:scale-110 transition-transform"
              >
                <Maximize size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute bottom-6 right-6 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
          <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center font-bold text-white text-sm">
            П
          </div>
          <span className="text-white text-sm font-medium">Платформа</span>
        </div>
      </div>
    </div>
  );
}
