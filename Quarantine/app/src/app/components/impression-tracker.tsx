"use client";

import { useEffect } from "react";
import { trackImpressions } from "@/lib/track";

type Source = "search" | "category" | "city" | "nearby" | "home";

// Records, in one batched request, all professionals shown in a list. Re-fires
// when the set of professionals changes (e.g. new search results), not on every
// unrelated re-render.
export default function ImpressionTracker({
  items,
  source,
}: {
  items: { professional_id: string; position: number }[];
  source: Source;
}) {
  const key = items.map((i) => i.professional_id).join(",");
  useEffect(() => {
    trackImpressions(items, source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, source]);
  return null;
}
