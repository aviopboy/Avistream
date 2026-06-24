import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRoute, Link, useLocation } from "wouter";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, Play, Tv, Captions, Bookmark, Trash2, Plus, X, Clock,
} from "lucide-react";
import {
  useGetAnimeEpisode, getGetAnimeEpisodeQueryKey,
  useSearchAnime, getSearchAnimeQueryKey,
  useGetAnimeSeries, getGetAnimeSeriesQueryKey,
} from "@workspace/api-client-react";
import type { AnimeCard, FlatEpisode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { addRecentWatched } from "@/hooks/use-recent-watched";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { Bookmark as BookmarkType } from "@/hooks/use-bookmarks";

type AudioLang = "japanese" | "english" | "hindi" | "tamil" | "malayalam";
const LANG_KEY = "avistream_audio";
const SUB_KEY = "avistream_sub";

const LANGUAGES: { value: AudioLang; label: string }[] = [
  { value: "japanese", label: "Japanese" },
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
  { value: "tamil", label: "Tamil" },
  { value: "malayalam", label: "Malayalam" },
];

/* ─── Timestamp helpers ─── */
function parseTimestamp(s: string): string {
  const cleaned = s.replace(/[^\d:]/g, "");
  const parts = cleaned.split(":").map(Number);
  if (parts.length === 1) {
    const m = parts[0] ?? 0;
    return `${m}:00`;
  }
  const [m = 0, sec = 0] = parts;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/* ─── Bookmark Panel ─── */
function BookmarkPanel({
  episodeId, seriesSlug, seriesTitle, seriesImage, episodeTitle, season, episodeNum,
  anchorRect, onNavigate, onClose,
}: {
  episodeId: string; seriesSlug: string; seriesTitle: string; seriesImage: string | null;
  episodeTitle: string; season: string; episodeNum: string;
  anchorRect: DOMRect | null;
  onNavigate: (episodeId: string, timestamp: string) => void;
  onClose: () => void;
}) {
  const { items, addBookmark, removeBookmark } = useBookmarks();
  const epBookmarks = items.filter((b) => b.episodeId === episodeId);

  const [adding, setAdding] = useState(false);
  const [tsInput, setTsInput] = useState("0:00");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 50);
  }, [adding]);

  const handleAdd = () => {
    const ts = parseTimestamp(tsInput.trim() || "0:00");
    addBookmark({ episodeId, seriesSlug, seriesTitle, seriesImage, episodeTitle, season, episodeNum, timestamp: ts });
    setAdding(false);
    setTsInput("0:00");
  };

  const top = anchorRect ? anchorRect.bottom + 8 : 64;
  const right = anchorRect ? window.innerWidth - anchorRect.right : 16;

  return createPortal(
    <div
      data-bookmark-panel
      className="w-72 rounded-2xl border overflow-hidden shadow-2xl"
      style={{
        position: "fixed", top, right, zIndex: 9999,
        background: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-sm font-semibold text-white">Bookmarks</span>
        </div>
        <div className="flex items-center gap-1">
          {!adding && (
            <button onClick={() => setAdding(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              title="Add bookmark at timestamp">
              <Plus className="w-3.5 h-3.5 text-white/60 hover:text-white" />
            </button>
          )}
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10">
            <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
          <input
            ref={inputRef}
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
            placeholder="e.g. 12:34"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25 min-w-0"
          />
          <button onClick={() => setAdding(false)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors px-1">
            Cancel
          </button>
          <button onClick={handleAdd}
            className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}>
            Save
          </button>
        </div>
      )}

      {/* Bookmark list */}
      <div className="max-h-64 overflow-y-auto scrollbar-none">
        {epBookmarks.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Bookmark className="w-7 h-7 mx-auto text-white/15" />
            <p className="text-xs text-white/30">No bookmarks yet.</p>
            <button onClick={() => setAdding(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
              + Add first bookmark
            </button>
          </div>
        ) : (
          <div className="py-1">
            {epBookmarks.map((b) => (
              <BookmarkRow key={b.id} bookmark={b}
                onPlay={() => onNavigate(b.episodeId, b.timestamp)}
                onDelete={() => removeBookmark(b.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Episode label */}
      <div className="px-4 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] text-white/25 truncate">{episodeTitle}</p>
      </div>
    </div>,
    document.body
  );
}

function BookmarkRow({ bookmark, onPlay, onDelete }: {
  bookmark: BookmarkType; onPlay: () => void; onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
        <Clock className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-semibold text-white">{bookmark.timestamp}</p>
        <p className="text-[10px] text-white/35">
          {new Date(bookmark.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
      <button onClick={onPlay}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
        style={{ background: "hsl(var(--primary))" }}
        title="Play from this timestamp">
        <Play className="w-3 h-3 fill-white text-white ml-0.5" />
      </button>
      <button onClick={onDelete}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
        title="Delete bookmark">
        <Trash2 className="w-3 h-3 text-red-400" />
      </button>
    </div>
  );
}

/* ─── Language Bar ─── */
function LanguageBar({ audio, sub, onAudio, onSub }: {
  audio: AudioLang; sub: boolean; onAudio: (l: AudioLang) => void; onSub: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {LANGUAGES.map((lang) => (
        <button key={lang.value} onClick={() => onAudio(lang.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            audio === lang.value
              ? "text-white border-primary"
              : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/10"
          }`}
          style={audio === lang.value ? { background: "hsl(var(--primary))" } : {}}>
          {lang.label}
        </button>
      ))}
      <button onClick={() => onSub(!sub)}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
          sub ? "bg-white/10 text-white border-white/20" : "bg-white/5 text-white/40 border-white/10 hover:text-white hover:bg-white/10"
        }`}>
        <Captions className="w-3.5 h-3.5" /> Sub
      </button>
    </div>
  );
}

/* ─── Recommendation Card ─── */
function RecCard({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/series/${anime.slug}`}>
      <div className="group flex-shrink-0 w-28 space-y-1.5">
        <div className="w-28 aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-primary/40 transition-all group-hover:scale-[1.04]">
          {anime.image
            ? <img src={anime.image} alt={anime.title} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center"><Tv className="w-6 h-6 text-white/20" /></div>}
        </div>
        <p className="text-xs text-white/50 group-hover:text-white/90 transition-colors line-clamp-2 leading-snug text-center">{anime.title}</p>
      </div>
    </Link>
  );
}

/* ─── Episode Item ─── */
function EpisodeItem({ ep, isActive, onClick }: { ep: FlatEpisode; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`group w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        isActive ? "border-primary/40 text-white" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-primary/20 text-white/70 hover:text-white"
      }`}
      style={isActive ? { background: "hsl(var(--primary) / 0.2)" } : {}}>
      {ep.thumbnail ? (
        <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative">
          <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          {isActive && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center"><Play className="w-3 h-3 fill-white text-white" /></div>}
        </div>
      ) : (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? "text-white" : "bg-white/10 text-white/40 group-hover:text-primary"}`}
          style={isActive ? { background: "hsl(var(--primary))" } : {}}>
          <Play className="w-3 h-3 ml-0.5 fill-current" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">Ep {ep.number}</div>
        <div className="text-sm font-medium truncate">{ep.title ?? `Episode ${ep.number}`}</div>
      </div>
    </button>
  );
}

/* ─── Main Watch Page ─── */
export default function Watch() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/watch/:episodeId");
  const baseEpisodeId = params?.episodeId ?? "";

  const slugMatch = baseEpisodeId.match(/^(.*?)-(\d+)x(\d+)$/);
  const isMovie = !slugMatch;
  const seriesSlug = isMovie ? baseEpisodeId : (slugMatch?.[1] ?? "");
  const currentSeason = slugMatch?.[2] ?? "1";
  const episodeNum = slugMatch?.[3] ?? "1";
  const recKeyword = seriesSlug.split("-")[0] ?? "";

  const [audioLang, setAudioLang] = useState<AudioLang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as AudioLang) ?? "japanese"; } catch { return "japanese"; }
  });
  const [subEnabled, setSubEnabled] = useState(() => {
    try { return localStorage.getItem(SUB_KEY) !== "false"; } catch { return true; }
  });
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const bookmarkBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { try { localStorage.setItem(LANG_KEY, audioLang); } catch { /**/ } }, [audioLang]);
  useEffect(() => { try { localStorage.setItem(SUB_KEY, String(subEnabled)); } catch { /**/ } }, [subEnabled]);

  // Close bookmark panel on outside click (panel is in a portal, so we check id)
  useEffect(() => {
    if (!bookmarkOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inBtn = bookmarkBtnRef.current?.contains(target);
      const inPanel = target.closest("[data-bookmark-panel]");
      if (!inBtn && !inPanel) setBookmarkOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bookmarkOpen]);

  const openBookmarks = () => {
    setAnchorRect(bookmarkBtnRef.current?.getBoundingClientRect() ?? null);
    setBookmarkOpen((v) => !v);
  };

  const isDub = audioLang !== "japanese";
  const episodeId = isDub ? `${baseEpisodeId}--dub` : baseEpisodeId;

  const { data: episodeResponse, isLoading: epLoading, isError: epError } = useGetAnimeEpisode(episodeId, {
    query: { enabled: !isMovie && !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) },
  });
  const { data: seriesData, isLoading: seriesLoading } = useGetAnimeSeries(seriesSlug, {
    query: { enabled: !!seriesSlug, queryKey: getGetAnimeSeriesQueryKey(seriesSlug) },
  });
  const { data: recData } = useSearchAnime(
    { q: recKeyword },
    { query: { enabled: recKeyword.length >= 2, queryKey: getSearchAnimeQueryKey({ q: recKeyword }) } }
  );

  const { items: bookmarkItems } = useBookmarks();
  const epBookmarkCount = bookmarkItems.filter((b) => b.episodeId === baseEpisodeId).length;

  const episode = episodeResponse?.data;
  const seriesInfo = seriesData?.data;
  const moviePlayerUrl = isMovie ? seriesInfo?.movie_players?.[0] ?? null : null;
  const bgImage = seriesInfo?.thumbnail ?? null;
  const episodeTitle = isMovie
    ? (seriesInfo?.title ?? "Movie")
    : `Season ${currentSeason} Ep ${episodeNum}`;

  const isLoading = isMovie ? seriesLoading : epLoading;
  const playerUrl = isMovie ? moviePlayerUrl : episode?.video_player ?? null;
  const showError = !isLoading && !playerUrl;
  const dubUnavailable = !isMovie && isDub && (epError || !episode?.video_player);

  const seasonEpisodes: FlatEpisode[] = (seriesInfo?.episodes ?? []).filter((ep) => ep.season === currentSeason);
  const recommendations = (recData?.results ?? []).filter((r) => r.slug !== seriesSlug).slice(0, 12);

  useEffect(() => {
    if (seriesInfo && seriesSlug) {
      addRecentWatched({ slug: seriesSlug, title: seriesInfo.title, image: seriesInfo.thumbnail ?? null });
    }
  }, [seriesInfo, seriesSlug]);

  const goToEpisode = (id: string) => setLocation(`/watch/${id}`);

  const handleBookmarkNavigate = (epId: string, _timestamp: string) => {
    setBookmarkOpen(false);
    goToEpisode(epId);
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col relative overflow-hidden">
      {/* Blurred anime background */}
      {bgImage && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <img src={bgImage} alt="" className="w-full h-full object-cover opacity-10"
            style={{ filter: "blur(40px)", transform: "scale(1.1)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 px-4 md:px-6 py-4 flex items-center gap-3">
        <Link href={seriesSlug ? `/series/${seriesSlug}` : "/"}>
          <Button variant="ghost" className="gap-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </Button>
        </Link>
        {seriesInfo && (
          <span className="text-sm font-semibold text-white/70 truncate max-w-[160px] md:max-w-xs">
            {seriesInfo.title}
          </span>
        )}
        {!isMovie && (
          <span className="text-xs text-white/30 hidden sm:block flex-shrink-0">{episodeTitle}</span>
        )}

        {/* Bookmark button with panel */}
        {!isMovie && (
          <div className="ml-auto">
            <button
              ref={bookmarkBtnRef}
              onClick={openBookmarks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
              style={bookmarkOpen || epBookmarkCount > 0
                ? { background: "hsl(var(--primary) / 0.15)", borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))" }
                : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bookmarks</span>
              {epBookmarkCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "hsl(var(--primary))" }}>
                  {epBookmarkCount}
                </span>
              )}
            </button>

            {bookmarkOpen && seriesInfo && (
              <BookmarkPanel
                episodeId={baseEpisodeId}
                seriesSlug={seriesSlug}
                seriesTitle={seriesInfo.title}
                seriesImage={seriesInfo.thumbnail ?? null}
                episodeTitle={episodeTitle}
                season={currentSeason}
                episodeNum={episodeNum}
                anchorRect={anchorRect}
                onNavigate={handleBookmarkNavigate}
                onClose={() => setBookmarkOpen(false)}
              />
            )}
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pb-16 flex flex-col gap-0">
        {/* Player */}
        <div className="w-full">
          {isLoading ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: "hsl(var(--primary) / 0.6)" }} />
              <p className="text-sm text-white/30">Loading player...</p>
            </div>
          ) : showError ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <AlertCircle className="w-12 h-12 text-white/20" />
              <h2 className="text-lg font-semibold text-white">
                {dubUnavailable ? `${LANGUAGES.find(l => l.value === audioLang)?.label} audio not available` : "Video unavailable"}
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {dubUnavailable ? "Try Japanese or switch to Sub." : "Player link couldn't be loaded. Try another episode."}
              </p>
              {dubUnavailable && (
                <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10" onClick={() => setAudioLang("japanese")}>
                  Switch to Japanese
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden bg-black ring-1 ring-white/10"
              style={{ boxShadow: "0 0 80px -20px hsl(var(--primary) / 0.2)" }}>
              <div className="aspect-video w-full">
                <iframe src={playerUrl!} allow="fullscreen; autoplay" allowFullScreen
                  className="w-full h-full border-0" title="Player" />
              </div>
            </div>
          )}
        </div>

        {/* Prev / Next (episodes only) */}
        {!isMovie && (
          <div className="w-full mt-4 flex items-center justify-between gap-3 px-1">
            <Button variant="ghost" className="gap-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
              disabled={!episode?.prev_episode_id || epLoading}
              onClick={() => episode?.prev_episode_id && goToEpisode(episode.prev_episode_id)}>
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Previous</span>
            </Button>
            <Button variant="ghost" className="gap-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
              disabled={!episode?.next_episode_id || epLoading}
              onClick={() => episode?.next_episode_id && goToEpisode(episode.next_episode_id)}>
              <span className="hidden sm:inline text-sm">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Language bar */}
        <div className="w-full mt-4 py-3 px-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <LanguageBar audio={audioLang} sub={subEnabled} onAudio={setAudioLang} onSub={setSubEnabled} />
        </div>

        {/* Episode list */}
        {!isMovie && seasonEpisodes.length > 0 && (
          <div className="w-full mt-8 space-y-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Season {currentSeason} — Episodes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
              {seasonEpisodes.map((ep) => (
                <EpisodeItem key={ep.id} ep={ep} isActive={ep.id === baseEpisodeId} onClick={() => goToEpisode(ep.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="w-full mt-10 space-y-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">You Might Also Like</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {recommendations.map((anime) => <RecCard key={anime.slug} anime={anime} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
