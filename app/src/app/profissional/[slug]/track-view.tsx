"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

export default function TrackView({ professionalId }: { professionalId: string }) {
  useEffect(() => {
    trackEvent(professionalId, "view");
  }, [professionalId]);

  return null;
}
