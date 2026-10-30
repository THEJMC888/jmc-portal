import { redirect } from "next/navigation";

// Placeholder video pages were backed by mock data; until the course library
// launches, send anyone landing here to its Coming Soon page.
export default function VideoPage() {
  redirect("/library");
}
