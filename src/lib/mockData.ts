import { Category, Video, UserProgress } from "@/types";

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "The Journey",
    description: "Guided psychedelic and transformational journey content",
    slug: "the-journey",
    icon: "🧭",
    videoCount: 8,
  },
  {
    id: "2",
    name: "Mindfulness",
    description: "Meditation, breathwork, and presence practices",
    slug: "mindfulness",
    icon: "🌿",
    videoCount: 12,
  },
  {
    id: "3",
    name: "Professional Development",
    description: "Leadership, purpose, and career transformation",
    slug: "professional-development",
    icon: "🚀",
    videoCount: 6,
  },
  {
    id: "4",
    name: "Integration",
    description: "Tools for integrating your experiences into daily life",
    slug: "integration",
    icon: "🔗",
    videoCount: 9,
  },
  {
    id: "5",
    name: "Community Sessions",
    description: "Recorded group sessions and Q&As",
    slug: "community",
    icon: "🤝",
    videoCount: 5,
  },
];

export const MOCK_VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Welcome to The Journeymen Collective",
    description:
      "An introduction to who we are, what we do, and what to expect on your journey with us.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_1",
    thumbnailUrl: "",
    duration: 720,
    categoryId: "1",
    categoryName: "The Journey",
    isPublished: true,
    orderIndex: 1,
    tags: ["intro", "orientation"],
    createdAt: "2024-01-15",
  },
  {
    id: "v2",
    title: "Preparing for Your Journey",
    description:
      "Everything you need to know before your transformational experience — set, setting, and intention.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_2",
    thumbnailUrl: "",
    duration: 1845,
    categoryId: "1",
    categoryName: "The Journey",
    isPublished: true,
    orderIndex: 2,
    tags: ["preparation", "set and setting"],
    createdAt: "2024-01-20",
  },
  {
    id: "v3",
    title: "Morning Breathwork Practice",
    description:
      "A 20-minute breathwork session to start your day with clarity and intention.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_3",
    thumbnailUrl: "",
    duration: 1200,
    categoryId: "2",
    categoryName: "Mindfulness",
    isPublished: true,
    orderIndex: 1,
    tags: ["breathwork", "morning", "daily practice"],
    createdAt: "2024-02-01",
  },
  {
    id: "v4",
    title: "Finding Your Purpose",
    description:
      "A deep dive into uncovering your authentic purpose and aligning your work with your values.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_4",
    thumbnailUrl: "",
    duration: 2700,
    categoryId: "3",
    categoryName: "Professional Development",
    isPublished: true,
    orderIndex: 1,
    tags: ["purpose", "career", "values"],
    createdAt: "2024-02-10",
  },
  {
    id: "v5",
    title: "Integration: The First 30 Days",
    description:
      "How to ground and integrate your experience in the weeks following your journey.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_5",
    thumbnailUrl: "",
    duration: 2100,
    categoryId: "4",
    categoryName: "Integration",
    isPublished: true,
    orderIndex: 1,
    tags: ["integration", "aftercare"],
    createdAt: "2024-02-15",
  },
  {
    id: "v6",
    title: "Body Scan Meditation",
    description:
      "A gentle guided body scan to reconnect with your physical self and release tension.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_6",
    thumbnailUrl: "",
    duration: 1500,
    categoryId: "2",
    categoryName: "Mindfulness",
    isPublished: true,
    orderIndex: 2,
    tags: ["meditation", "body scan", "relaxation"],
    createdAt: "2024-02-20",
  },
  {
    id: "v7",
    title: "Community Q&A — January 2024",
    description:
      "Monthly community session with Gary and the team answering your questions.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_7",
    thumbnailUrl: "",
    duration: 3600,
    categoryId: "5",
    categoryName: "Community Sessions",
    isPublished: true,
    orderIndex: 1,
    tags: ["Q&A", "community", "live session"],
    createdAt: "2024-01-31",
  },
  {
    id: "v8",
    title: "Leadership Through Vulnerability",
    description:
      "How embracing vulnerability transforms your leadership and deepens your relationships.",
    bunnyLibraryId: "YOUR_LIBRARY_ID",
    bunnyVideoId: "YOUR_VIDEO_ID_8",
    thumbnailUrl: "",
    duration: 2400,
    categoryId: "3",
    categoryName: "Professional Development",
    isPublished: true,
    orderIndex: 2,
    tags: ["leadership", "vulnerability", "relationships"],
    createdAt: "2024-03-01",
  },
];

export const MOCK_PROGRESS: Record<string, UserProgress> = {
  v1: {
    videoId: "v1",
    progressSeconds: 720,
    completed: true,
    lastWatchedAt: "2024-03-10",
  },
  v2: {
    videoId: "v2",
    progressSeconds: 900,
    completed: false,
    lastWatchedAt: "2024-03-12",
  },
  v3: {
    videoId: "v3",
    progressSeconds: 600,
    completed: false,
    lastWatchedAt: "2024-03-14",
  },
};

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

export function getProgressPercent(
  videoId: string,
  duration: number
): number {
  const p = MOCK_PROGRESS[videoId];
  if (!p) return 0;
  return Math.round((p.progressSeconds / duration) * 100);
}
