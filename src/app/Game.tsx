"use client";
import { useEffect, useRef } from "react";
import { MARKUP } from "@/game/markup";

export default function Game() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // StrictMode startet Effekte im Dev doppelt
    started.current = true;
    import("@/game/game.js").then((m) => m.initGame());
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
