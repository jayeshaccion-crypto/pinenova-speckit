"use client";

import { useEffect } from "react";
import { trackRecentlyViewed } from "./RecentlyViewed";

export function TrackRecentlyViewed({ slug }: { slug: string }) {
  useEffect(() => {
    trackRecentlyViewed(slug);
  }, [slug]);

  return null;
}
