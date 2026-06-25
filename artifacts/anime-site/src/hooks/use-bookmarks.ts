import { useState, useCallback } from "react";

export type Bookmark = {
  id: string;
  episodeId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesImage: string | null;
  episodeTitle: string;
  season: string;
  episodeNum: string;
  timestamp: string;
  savedAt: number;
};

const KEY = "avistream_bookmarks";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function load(): Bookmark[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Bookmark[]; } catch { return []; }
}

function persist(items: Bookmark[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function useBookmarks() {
  const [items, setItems] = useState<Bookmark[]>(load);

  const refresh = useCallback(() => setItems(load()), []);

  const addBookmark = useCallback((b: Omit<Bookmark, "id" | "savedAt">) => {
    const next = [{ ...b, id: uid(), savedAt: Date.now() }, ...load()];
    persist(next);
    setItems(next);
  }, []);

  const removeBookmark = useCallback((id: string) => {
    const next = load().filter((x) => x.id !== id);
    persist(next);
    setItems(next);
  }, []);

  const updateBookmark = useCallback((id: string, timestamp: string) => {
    const next = load().map((x) => x.id === id ? { ...x, timestamp } : x);
    persist(next);
    setItems(next);
  }, []);

  return { items, refresh, addBookmark, removeBookmark, updateBookmark };
}

export function getEpisodeBookmarks(episodeId: string): Bookmark[] {
  return load().filter((b) => b.episodeId === episodeId);
}
