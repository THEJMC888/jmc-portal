"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { MOCK_VIDEOS, MOCK_CATEGORIES } from "@/lib/mockData";
import { clsx } from "clsx";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVideos = MOCK_VIDEOS.filter((video) => {
    const matchesSearch =
      !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory || video.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="brand-subtitle text-gold text-xs mb-2 tracking-[0.25em]">
          Content Library
        </p>
        <h1 className="brand-title text-3xl text-white mb-1">
          Video Library
        </h1>
        <p className="text-muted text-sm">
          {MOCK_VIDEOS.length} videos across {MOCK_CATEGORIES.length} categories
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-surface border border-border rounded-lg pl-11 pr-4 py-3 text-white placeholder-muted focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-3 text-muted hover:text-white hover:border-gold/30 transition-all">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm">Filter</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            !selectedCategory
              ? "bg-gold text-black"
              : "bg-surface border border-border text-muted hover:text-white hover:border-gold/30"
          )}
        >
          All
        </button>
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.id ? null : cat.id
              )
            }
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              selectedCategory === cat.id
                ? "bg-gold text-black"
                : "bg-surface border border-border text-muted hover:text-white hover:border-gold/30"
            )}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {(searchQuery || selectedCategory) && (
        <p className="text-sm text-muted">
          Showing {filteredVideos.length} of {MOCK_VIDEOS.length} videos
        </p>
      )}

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted text-lg mb-2">No videos found</p>
          <p className="text-muted/60 text-sm">
            Try a different search or category
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}
            className="mt-4 text-sm text-gold hover:text-gold-light transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
