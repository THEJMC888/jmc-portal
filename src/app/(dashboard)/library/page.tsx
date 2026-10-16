"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { MOCK_VIDEOS, MOCK_CATEGORIES } from "@/lib/mockData";

const CARD_SHADOW = [
  "inset 0 3px 0 rgba(255,255,255,0.22)", "inset 0 1px 0 rgba(255,255,255,0.38)",
  "inset 2px 0 0 rgba(255,255,255,0.06)", "inset 0 -3px 8px rgba(0,0,0,0.55)",
  "inset -2px 0 5px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(0,0,0,0.90)", "0 4px 0 rgba(0,0,0,0.75)", "0 6px 0 rgba(0,0,0,0.58)",
  "0 8px 0 rgba(0,0,0,0.42)", "0 10px 0 rgba(0,0,0,0.28)", "0 12px 0 rgba(0,0,0,0.16)",
  "0 14px 0 rgba(0,0,0,0.08)", "0 16px 0 rgba(0,0,0,0.04)",
  "0 20px 28px rgba(0,0,0,0.75)", "0 38px 65px rgba(0,0,0,0.58)",
  "5px 0 16px rgba(0,0,0,0.45)", "0 0 0 1px rgba(0,0,0,0.6)",
].join(", ");

const GOLD_BTN_SHADOW = [
  "inset 0 1px 0 rgba(240,220,170,0.4)", "inset 0 -2px 4px rgba(0,0,0,0.25)",
  "0 2px 0 rgba(20,12,0,0.85)", "0 4px 0 rgba(20,12,0,0.65)",
  "0 6px 0 rgba(20,12,0,0.40)", "0 8px 0 rgba(20,12,0,0.20)",
  "0 10px 20px rgba(0,0,0,0.60)", "0 4px 30px rgba(194,159,96,0.25)",
].join(", ");

const pillBase = {
  fontFamily: "Syne, system-ui, sans-serif",
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  padding: "8px 18px",
  borderRadius: 24,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  transition: "transform 0.15s",
} as React.CSSProperties;

const pillInactive = {
  ...pillBase,
  background: "linear-gradient(175deg, rgba(255,255,255,0.09) 0%, rgba(20,55,130,0.28) 20%, rgba(6,18,55,0.48) 50%, rgba(3,8,26,0.68) 100%)",
  borderTop: "2px solid rgba(255,255,255,0.35)",
  borderLeft: "1px solid rgba(255,255,255,0.18)",
  borderRight: "1.5px solid rgba(194,159,96,0.15)",
  borderBottom: "1.5px solid rgba(140,145,155,0.5)",
  boxShadow: CARD_SHADOW,
  color: "rgba(222,211,200,0.75)",
} as React.CSSProperties;

const pillActive = {
  ...pillBase,
  fontWeight: 700,
  background: "linear-gradient(180deg, #DEC272 0%, #C8A04C 20%, #A07A28 44%, #BE9642 66%, #D4B462 86%, #E0C878 100%)",
  boxShadow: GOLD_BTN_SHADOW,
  color: "#08203A",
} as React.CSSProperties;

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
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 16, height: 16, color: "rgba(222,211,200,0.35)", pointerEvents: "none",
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            style={{
              width: "100%",
              background: "linear-gradient(180deg, rgba(1,8,22,0.88) 0%, rgba(4,15,38,0.72) 100%)",
              boxShadow: [
                "inset 0 3px 10px rgba(0,0,0,0.65)",
                "inset 0 1px 5px rgba(0,0,0,0.5)",
                "inset 0 6px 20px rgba(0,0,0,0.38)",
                "inset 0 0 0 1.5px rgba(0,0,0,0.45)",
                "inset 2px 0 8px rgba(0,0,0,0.22)",
                "0 1px 0 rgba(255,255,255,0.07)",
              ].join(", "),
              border: "1.5px solid rgba(255,255,255,0.06)",
              borderTop: "1.5px solid rgba(0,0,0,0.55)",
              borderRadius: 10,
              padding: "14px 16px 14px 48px",
              color: "#DED3C8",
              fontFamily: "Syne, system-ui, sans-serif",
              fontSize: "0.85rem",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(194,159,96,0.25)";
              e.currentTarget.style.boxShadow = [
                "inset 0 3px 10px rgba(0,0,0,0.65)",
                "inset 0 1px 5px rgba(0,0,0,0.5)",
                "inset 0 6px 20px rgba(0,0,0,0.38)",
                "inset 0 0 0 1.5px rgba(0,0,0,0.45)",
                "0 0 0 2px rgba(194,159,96,0.12)",
                "0 1px 0 rgba(255,255,255,0.07)",
              ].join(", ");
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderTopColor = "rgba(0,0,0,0.55)";
              e.currentTarget.style.boxShadow = [
                "inset 0 3px 10px rgba(0,0,0,0.65)",
                "inset 0 1px 5px rgba(0,0,0,0.5)",
                "inset 0 6px 20px rgba(0,0,0,0.38)",
                "inset 0 0 0 1.5px rgba(0,0,0,0.45)",
                "inset 2px 0 8px rgba(0,0,0,0.22)",
                "0 1px 0 rgba(255,255,255,0.07)",
              ].join(", ");
            }}
          />
        </div>
        <button style={{
          ...pillInactive,
          borderRadius: 10,
          padding: "14px 18px",
          gap: 8,
          flexShrink: 0,
        }}>
          <SlidersHorizontal style={{ width: 15, height: 15 }} />
          <span style={{ fontSize: "0.82rem" }}>Filter</span>
        </button>
      </div>

      {/* Category Pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={!selectedCategory ? pillActive : pillInactive}
          onMouseEnter={(e) => { if (selectedCategory) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          All
        </button>
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            style={selectedCategory === cat.id ? pillActive : pillInactive}
            onMouseEnter={(e) => { if (selectedCategory !== cat.id) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
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
