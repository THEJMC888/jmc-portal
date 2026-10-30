"use client";

import { useEffect } from "react";
import StatusPage from "@/components/StatusPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      title="Something went wrong"
      message="We hit an unexpected snag loading this page. Your data is safe — please try again."
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
