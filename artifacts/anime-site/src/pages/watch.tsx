import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Loader2,
  AlertCircle, Play, Tv, Captions, Bookmark, BookmarkCheck,
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

export default function Watch() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/watch/:episodeId");
  const baseEpisodeId = params?.episodeId ?? "";

  // Detect movie: no NxN pattern in the ID
  const slugMatch = baseEpisodeId.match(/^(.*?)-(\d+)x(\d+)$/);
  const isMovie = !slugMatch;
  const seriesSlug = isMovie ? baseEpisodeId : (slugMatch?.[1] ?? "");
  const currentSeason = slugMatch?.[2] ?? "1";
  const recKeyword = seriesSlug.split("-")[0] ?? "";

  const [audioLang, setAudioLang] = useState<AudioLang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as AudioLang) ?? "japanese"; } catch { return "japanese"; }
  });
  const [subEnabled, setSubEnabled] = useState(() => {
    try { return localStorage.getItem(SUB_KEY) !== "false"; } catch { return true; }
  });

  useEffect(() => { try { localStorage.setItem(LANG_KEY, audioLang); } catch { /**/ } }, [audioLang]);
  useEffect(() => { try { localStorage.setItem(SUB_KEY, String(subEnabled)); } catch { /**/ } }, [subEnabled]);

  const isDub = audioLang !== "japanese";
  const episodeId = isDub ? `${baseEpisodeId}--dub` : baseEpisodeId;

  // Episode data (for regular episodes)
  const { data: episodeResponse, isLoading: epLoading, isError: epError } = useGetAnimeEpisode(episodeId, {
    query: { enabled: !isMovie && !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) },
  });

  // Series data (always loaded — used for episodes list, background, movie player)
  const { data: seriesData, isLoading: seriesLoading } = useGetAnimeSeries(seriesSlug, {
    query: { enabled: !!seriesSlug, queryKey: getGetAnimeSeriesQueryKey(seriesSlug) },
  });

  const { data: recData } = useSearchAnime(
    { q: recKeyword },
    { query: { enabled: recKeyword.length >= 2, queryKey: getSearchAnimeQueryKey({ q: recKeyword }) } }
  );

  const { items: bookmarks, toggle: toggleBookmark } = useBookmarks();
  const isBookmarked = bookmarks.some((b) => b.episodeId === baseEpisodeId);

  const episode = episodeResponse?.data;
  const seriesInfo = seriesData?.data;
  const moviePlayerUrl = isMovie ? seriesInfo?.movie_players?.[0] ?? null : null;
  const bgImage = seriesInfo?.thumbnail ?? null;

  const isLoading = isMovie ? seriesLoading : epLoading;
  const isError = isMovie ? (!seriesLoading && !moviePlayerUrl) : epError;

  const seasonEpisodes: FlatEpisode[] = (seriesInfo?.episodes ?? []).filter((ep) => ep.season === currentSeason);
  const recommendations = (recData?.results ?? []).filter((r) => r.slug !== seriesSlug).slice(0, 12);

  // Save to recent watched once we have series info
  useEffect(() => {
    if (seriesInfo && seriesSlug) {
      addRecentWatched({ slug: seriesSlug, title: seriesInfo.title, image: seriesInfo.thumbnail ?? null });
    }
  }, [seriesInfo, seriesSlug]);

  const goToEpisode = (id: string) => setLocation(`/watch/${id}`);

  const handleBookmark = () => {
    if (!seriesInfo) return;
    const epNum = slugMatch?.[3] ?? "1";
    toggleBookmark({
      episodeId: baseEpisodeId,
      seriesSlug,
      seriesTitle: seriesInfo.title,
      seriesImage: seriesInfo.thumbnail ?? null,
      episodeTitle: isMovie ? seriesInfo.title : `Season ${currentSeason} Episode ${epNum}`,
      season: currentSeason,
      episodeNum: epNum,
    });
  };

  const playerUrl = isMovie ? moviePlayerUrl : episode?.video_player ?? null;
  const showError = !isLoading && (isError || !playerUrl);
  const dubUnavailable = !isMovie && isDub && (epError || !episode?.video_player);

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
            <span className="hidden sm:inline text-sm">Back to Series</span>
          </Button>
        </Link>
        {seriesInfo && (
          <span className="text-sm font-semibold text-white/70 truncate max-w-[200px] md:max-w-xs">
            {seriesInfo.title}
          </span>
        )}
        {/* Bookmark button */}
        {!isMovie && (
          <button onClick={handleBookmark}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
            style={isBookmarked
              ? { background: "hsl(var(--primary) / 0.15)", borderColor: "hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))" }
              : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
            {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>
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

        {/* Nav row (episodes only) */}
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

        {/* Season episodes */}
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
