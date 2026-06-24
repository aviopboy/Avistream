import { useState, useCallback } from "react";

export type Bookmark = {
  episodeId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesImage: string | null;
  episodeTitle: string;
  season: string;
  episodeNum: string;
  savedAt: number;
};

const KEY = "avistream_bookmarks";

function load(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Bookmark[];
  } catch {
    return [];
  }
}

function save(items: Bookmark[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function addBookmark(b: Omit<Bookmark, "savedAt">) {
  const prev = load().filter((x) => x.episodeId !== b.episodeId);
  save([{ ...b, savedAt: Date.now() }, ...prev]);
}

export function removeBookmark(episodeId: string) {
  save(load().filter((x) => x.episodeId !== episodeId));
}

export function isBookmarked(episodeId: string): boolean {
  return load().some((x) => x.episodeId === episodeId);
}

export function useBookmarks() {
  const [items, setItems] = useState<Bookmark[]>(load);

  const refresh = useCallback(() => setItems(load()), []);

  const toggle = useCallback((b: Omit<Bookmark, "savedAt">) => {
    const prev = load();
    const exists = prev.some((x) => x.episodeId === b.episodeId);
    const next = exists
      ? prev.filter((x) => x.episodeId !== b.episodeId)
      : [{ ...b, savedAt: Date.now() }, ...prev];
    save(next);
    setItems(next);
    return !exists;
  }, []);

  const clear = useCallback(() => { save([]); setItems([]); }, []);

  return { items, refresh, toggle, clear };
}
