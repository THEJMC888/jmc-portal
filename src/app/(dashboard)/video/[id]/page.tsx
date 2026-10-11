"use client";

import Link from "next/link";
import { use } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Tag, CheckCircle } from "lucide-react";
import { MOCK_VIDEOS, formatDuration, getProgressPercent } from "@/lib/mockData";
import VideoCard from "@/components/VideoCard";

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export default function VideoPage({ params }: VideoPageProps) {
  const { id } = use(params);
  const video = MOCK_VIDEOS.find((v) => v.id === id);

  if (!video) {
    notFound();
  }

  const progress = getProgressPercent(video.id, video.duration);
  const isCompleted = progress === 100;

  // Related videos: same category, exclude current
  const related = MOCK_VIDEOS.filter(
    (v) => v.categoryId === video.categoryId && v.id !== video.id
  ).slice(0, 3);

  // Bunny.net embed URL
  const embedUrl = `https://iframe.mediadelivery.net/embed/${video.bunnyLibraryId}/${video.bunnyVideoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Video Player */}
          <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video">
            {video.bunnyVideoId === "YOUR_VIDEO_ID_1" ||
            video.bunnyVideoId.startsWith("YOUR_VIDEO_ID") ? (
              // Placeholder when real video IDs aren't set yet
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface to-background">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
                  <span className="text-2xl">🎬</span>
                </div>
                <p className="text-white font-medium mb-1">Video Player</p>
                <p className="text-muted text-sm text-center max-w-xs">
                  Connect your Bunny.net library ID and video ID to display
                  videos here.
                </p>
              </div>
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen
                title={video.title}
              />
            )}
          </div>

          {/* Video Info */}
          <div>
            {video.categoryName && (
              <p className="text-xs text-gold font-medium uppercase tracking-wide mb-2">
                {video.categoryName}
              </p>
            )}
            <h1 className="text-2xl font-heading font-semibold text-white mb-3">
              {video.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted mb-4">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(video.duration)}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
              {progress > 0 && !isCompleted && (
                <span className="text-gold">{progress}% complete</span>
              )}
            </div>

            {/* Progress bar */}
            {progress > 0 && (
              <div className="h-1 bg-border rounded-full mb-5">
                <div
                  className={`h-full rounded-full ${isCompleted ? "bg-green-500" : "bg-gold"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <p className="text-muted leading-relaxed">{video.description}</p>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted" />
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-surface-hover border border-border text-muted px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Related Videos */}
        <div className="col-span-1">
          {related.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">
                Up Next
              </h3>
              <div className="space-y-4">
                {related.map((v) => (
                  <VideoCard key={v.id} video={v} showCategory={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
