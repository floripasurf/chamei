"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

// Records local demand: a category browse scoped to a city. Feeds the
// demand×supply-by-city analysis (search_events.city).
export default function CityBrowseTracker({
  categorySlug,
  city,
  resultCount,
}: {
  categorySlug: string;
  city: string;
  resultCount: number;
}) {
  useEffect(() => {
    trackEvent({
      type: "search",
      source: "category_browse",
      category_slug: categorySlug,
      city,
      result_count: resultCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, city]);
  return null;
}
