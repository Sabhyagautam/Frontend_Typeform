"use client";

/**
 * KeepAlive — pings the backend every 10 minutes so Render's free tier
 * never goes to sleep. Runs silently in the background, no UI.
 */

import { useEffect } from "react";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function KeepAlive() {
  useEffect(() => {
    // Ping immediately on mount so the server is awake right away
    function ping() {
      fetch(`${BACKEND}/`, { method: "GET", cache: "no-store" }).catch(() => {});
    }

    ping();
    const timer = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return null;
}
