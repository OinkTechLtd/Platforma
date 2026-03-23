"use client";

import { useState, useRef } from "react";
import { Upload as UploadIcon, X, Film } from "lucide-react";
import useUpload from "@/utils/useUpload";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [upload] = useUpload();

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setError(null);
    } else {
      setError("Пожалуйста, выберите видео файл");
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !videoFile) {
      setError("Пожалуйста, заполните обязательные поля");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const demoChannelId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

      setUploadProgress(20);
      const videoUploadResult = await upload({
        url: URL.createObjectURL(videoFile),
      });

      if (videoUploadResult.error) {
        throw new Error("Ошибка загрузки видео: " + videoUploadResult.error);
      }

      setUploadProgress(50);
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailUploadResult = await upload({
          url: URL.createObjectURL(thumbnailFile),
        });

        if (!thumbnailUploadResult.error) {
          thumbnailUrl = thumbnailUploadResult.url;
        }
      }

      setUploadProgress(70);
      const videoElement = document.createElement("video");
      videoElement.src = URL.createObjectURL(videoFile);
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => resolve();
      });
      const duration = Math.floor(videoElement.duration);

      setUploadProgress(90);
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: demoChannelId,
          title,
          description,
          videoUrl: videoUploadResult.url,
          thumbnailUrl,
          duration,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при сохранении видео");
      }

      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => {
        window.location.href = `/watch/${data.video.id}`;
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Ошибка при загрузке видео");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-white text-3xl font-bold mb-8">Загрузить видео</h1>

        {success ? (
          <div className="bg-green-900/20 border border-green-500 rounded-xl p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-white text-2xl font-semibold mb-2">
              Видео успешно загружено!
            </h2>
            <p className="text-[#aaa]">Перенаправление на страницу видео...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-xl p-4 text-red-500">
                {error}
              </div>
            )}

            <div className="bg-[#272727] rounded-xl p-6">
              <h2 className="text-white text-xl font-semibold mb-4">
                Видео файл *
              </h2>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />

              {!videoFile ? (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#3f3f3f] rounded-xl p-12 hover:border-blue-500 transition-colors"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-[#3f3f3f] rounded-full flex items-center justify-center">
                      <UploadIcon size={40} color="#fff" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium mb-1">
                        Выберите видео файл
                      </p>
                      <p className="text-[#aaa] text-sm">
                        или перетащите его сюда
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-[#1f1f1f] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center">
                      <Film size={24} color="white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{videoFile.name}</p>
                      <p className="text-[#aaa] text-sm">
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="p-2 hover:bg-[#3f3f3f] rounded-full transition-colors"
                  >
                    <X size={20} color="#fff" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#272727] rounded-xl p-6">
              <label className="block mb-4">
                <span className="text-white font-medium mb-2 block">
                  Название *
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название видео"
                  className="w-full bg-[#1f1f1f] border border-[#3f3f3f] rounded-lg px-4 py-3 text-white placeholder-[#aaa] focus:outline-none focus:border-blue-500 transition-colors"
                  maxLength={100}
                />
              </label>

              <label className="block mb-4">
                <span className="text-white font-medium mb-2 block">
                  Описание
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите зрителям о вашем видео"
                  rows={4}
                  className="w-full bg-[#1f1f1f] border border-[#3f3f3f] rounded-lg px-4 py-3 text-white placeholder-[#aaa] focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  maxLength={5000}
                />
              </label>

              <label className="block">
                <span className="text-white font-medium mb-2 block">Теги</span>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="технологии, обзор, новости (через запятую)"
                  className="w-full bg-[#1f1f1f] border border-[#3f3f3f] rounded-lg px-4 py-3 text-white placeholder-[#aaa] focus:outline-none focus:border-blue-500 transition-colors"
                />
              </label>
            </div>

            <div className="bg-[#272727] rounded-xl p-6">
              <h2 className="text-white text-xl font-semibold mb-4">
                Превью (миниатюра)
              </h2>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />

              {!thumbnailFile ? (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#3f3f3f] rounded-xl p-8 hover:border-blue-500 transition-colors"
                >
                  <div className="flex flex-col items-center gap-3">
                    <UploadIcon size={32} color="#fff" />
                    <p className="text-white text-sm">Загрузить превью</p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnailFile(null)}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  >
                    <X size={20} color="#fff" />
                  </button>
                </div>
              )}
            </div>

            {uploading && (
              <div className="bg-[#272727] rounded-xl p-6">
                <div className="mb-2 flex justify-between text-white text-sm">
                  <span>Загрузка...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <a
                href="/"
                className="px-6 py-3 text-white hover:bg-[#272727] rounded-lg transition-colors"
              >
                Отмена
              </a>
              <button
                type="submit"
                disabled={uploading || !title || !videoFile}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Загрузка..." : "Опубликовать"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
