"use client";

import { useEffect } from "react";
import { trackProfileView } from "@/lib/track";

// Fires one profile-view event on mount (client-side, so bots/prefetch that
// don't run JS are mostly excluded).
export default function ProfileViewTracker({ professionalId }: { professionalId: string }) {
  useEffect(() => {
    trackProfileView(professionalId);
  }, [professionalId]);
  return null;
}
