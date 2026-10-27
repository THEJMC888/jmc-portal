export interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  videoCount?: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  bunnyLibraryId: string;
  bunnyVideoId: string;
  thumbnailUrl?: string;
  duration: number; // seconds
  categoryId: string;
  categoryName?: string;
  isPublished: boolean;
  orderIndex: number;
  tags: string[];
  createdAt: string;
}

export interface UserProgress {
  videoId: string;
  progressSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: "member" | "admin";
}

export interface SlideBackground {
  type: "color" | "gradient" | "image";
  color?: string;
  gradient?: { from: string; to: string; angle: number };
  imageDataUrl?: string;
  overlayOpacity?: number;
}

export interface SlideElement {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  textShadow?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  imageDataUrl?: string;
  objectFit?: "cover" | "contain";
  clipShape?: "rectangle" | "square" | "circle";
  opacity?: number;
}

export interface VisionSlide {
  id: string;
  background: SlideBackground;
  elements: SlideElement[];
  kenBurnsVariant: number;
  statementSource?: { categoryId: string; beingElId: string; doingElId: string };
  statementOverridden?: boolean;
}

export interface VisionVideo {
  id: string;
  title: string;
  slides: VisionSlide[];
  musicDataUrl?: string;
  musicName?: string;
  slideDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttunementCard {
  id: string;
  title: string;
  line1: string;
  line2: string;
  backgroundImageDataUrl?: string;
  backgroundGradient?: { from: string; to: string; angle: number };
  overlayOpacity?: number;
  generationMode: "manual" | "auto" | "ai";
  visionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail_url?: string;
  bunny_library_id?: string;
  is_published: boolean;
  requires_access: boolean;
  order_index: number;
  created_at: string;
  // Computed client-side from user_course_access
  hasAccess?: boolean;
  videoCount?: number;
}

export interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  bunny_video_id: string;
  duration_seconds: number;
  thumbnail_url?: string;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

export interface UserCourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  granted_at: string;
  granted_by?: string;
  expires_at?: string;
}

export interface VisionSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  visionId: string;
  visionTitle: string;
  status: "pending" | "approved" | "needs_revision";
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  slideCount: number;
}
