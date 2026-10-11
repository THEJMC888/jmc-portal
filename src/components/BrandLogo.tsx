import Image from "next/image";
import { clsx } from "clsx";

interface BrandLogoProps {
  /** sm = sidebar, md = default, lg = login hero */
  size?: "sm" | "md" | "lg";
  /** Show the text lockup next to / below the mark */
  showText?: boolean;
  textLayout?: "beside" | "below";
  className?: string;
}

const MARK_SIZES = { sm: 36, md: 48, lg: 80 };
const TEXT_SIZES = { sm: 120, md: 160, lg: 260 };

export default function BrandLogo({
  size = "md",
  showText = true,
  textLayout = "beside",
  className = "",
}: BrandLogoProps) {
  const markPx = MARK_SIZES[size];
  const textPx = TEXT_SIZES[size];

  const mark = (
    <Image
      src="/logo-mark.png"
      alt="The Journeymen Collective logo mark"
      width={markPx}
      height={markPx}
      className="rounded-full flex-shrink-0"
      priority
    />
  );

  // White text lockup — for use on dark backgrounds (the app)
  const textLockup = (
    <Image
      src="/logo-text-white.png"
      alt="The Journeymen Collective"
      width={textPx}
      height={Math.round(textPx * 0.18)} // ~18% aspect ratio of the text PNG
      className="object-contain"
      priority
    />
  );

  if (!showText) return <div className={className}>{mark}</div>;

  if (textLayout === "below") {
    return (
      <div className={clsx("flex flex-col items-center", className)}
        style={{ gap: size === "lg" ? "1.25rem" : "0.75rem" }}>
        {mark}
        {textLockup}
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center", className)}
      style={{ gap: size === "sm" ? "0.6rem" : "0.85rem" }}>
      {mark}
      {textLockup}
    </div>
  );
}
