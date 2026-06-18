import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle, Play, Tv, Captions } from "lucide-react";
import {
  useGetAnimeEpisode,
  getGetAnimeEpisodeQueryKey,
  useSearchAnime,
  getSearchAnimeQueryKey,
  useGetAnimeSeries,
  getGetAnimeSeriesQueryKey,
} from "@workspace/api-client-react";
import type { AnimeCard, FlatEpisode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

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

function LanguageBar({
  audio,
  sub,
  onAudio,
  onSub,
}: {
  audio: AudioLang;
  sub: boolean;
  onAudio: (l: AudioLang) => void;
  onSub: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" data-testid="language-bar">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.value}
          onClick={() => onAudio(lang.value)}
          data-testid={`button-lang-${lang.value}`}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
            audio === lang.value
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_-3px_rgba(139,92,246,0.7)]"
              : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/10"
          }`}
        >
          {lang.label}
        </button>
      ))}

      {/* Sub toggle */}
      <button
        onClick={() => onSub(!sub)}
        data-testid="button-sub-toggle"
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
          sub
            ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
            : "bg-white/5 text-white/40 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/10"
        }`}
      >
        <Captions className="w-3.5 h-3.5" />
        Sub
      </button>
    </div>
  );
}

function RecommendationCard({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/series/${anime.slug}`} data-testid={`card-rec-${anime.slug}`}>
      <div className="group flex-shrink-0 w-28 space-y-2">
        <div className="w-28 aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-primary/30 transition-all duration-200 group-hover:scale-[1.04] group-hover:shadow-[0_4px_24px_-6px_rgba(139,92,246,0.4)]">
          {anime.image ? (
            <img
              src={anime.image}
              alt={anime.title}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>
        <p className="text-xs text-white/50 group-hover:text-white/90 transition-colors line-clamp-2 leading-snug text-center">
          {anime.title}
        </p>
      </div>
    </Link>
  );
}

function EpisodeItem({
  ep,
  isActive,
  onClick,
}: {
  ep: FlatEpisode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`button-episode-${ep.id}`}
      className={`group w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        isActive
          ? "bg-primary/20 border-primary/40 text-white"
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-primary/20 text-white/70 hover:text-white"
      }`}
    >
      {ep.thumbnail ? (
        <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative">
          <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
          {isActive && (
            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
              <Play className="w-3 h-3 fill-white text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-white/10 text-white/40 group-hover:bg-primary/20 group-hover:text-primary"
          }`}
        >
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

  const [audioLang, setAudioLang] = useState<AudioLang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as AudioLang) ?? "japanese"; } catch { return "japanese"; }
  });
  const [subEnabled, setSubEnabled] = useState(() => {
    try { return localStorage.getItem(SUB_KEY) !== "false"; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, audioLang); } catch { /* ignore */ }
  }, [audioLang]);

  useEffect(() => {
    try { localStorage.setItem(SUB_KEY, String(subEnabled)); } catch { /* ignore */ }
  }, [subEnabled]);

  // Non-Japanese langs map to the dub track (API only has one alternate track)
  const isDub = audioLang !== "japanese";
  const episodeId = isDub ? `${baseEpisodeId}--dub` : baseEpisodeId;

  const slugMatch = baseEpisodeId.match(/^(.*?)-(\d+)x(\d+)$/);
  const seriesSlug = slugMatch ? slugMatch[1] : "";
  const currentSeason = slugMatch ? slugMatch[2] : "1";
  const recKeyword = seriesSlug.split("-")[0] ?? "";

  const { data: episodeResponse, isLoading, isError } = useGetAnimeEpisode(episodeId, {
    query: { enabled: !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) },
  });

  const { data: seriesData } = useGetAnimeSeries(seriesSlug, {
    query: { enabled: !!seriesSlug, queryKey: getGetAnimeSeriesQueryKey(seriesSlug) },
  });

  const { data: recData } = useSearchAnime(
    { q: recKeyword },
    { query: { enabled: recKeyword.length >= 2, queryKey: getSearchAnimeQueryKey({ q: recKeyword }) } }
  );

  const episode = episodeResponse?.data;

  const seasonEpisodes: FlatEpisode[] = (seriesData?.data?.episodes ?? []).filter(
    (ep) => ep.season === currentSeason
  );

  const recommendations = (recData?.results ?? [])
    .filter((r) => r.slug !== seriesSlug)
    .slice(0, 12);

  const goToEpisode = (id: string) => setLocation(`/watch/${id}`);

  const dubUnavailable = isDub && (isError || !episode?.video_player);

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-4 md:px-6 py-4 flex items-center z-10">
        <Link href={seriesSlug ? `/series/${seriesSlug}` : "/"} data-testid="link-back">
          <Button variant="ghost" className="gap-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back to Series</span>
          </Button>
        </Link>
        <span className="ml-auto text-xs text-white/20 hidden md:block font-mono truncate max-w-xs">
          {baseEpisodeId}
        </span>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 pb-16 flex flex-col gap-0">
        {/* Player */}
        <div className="w-full">
          {isLoading ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary/60" />
              <p className="text-sm text-white/30">Loading player...</p>
            </div>
          ) : isError || !episode?.video_player ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <AlertCircle className="w-12 h-12 text-white/20" />
              <h2 className="text-lg font-semibold text-white">
                {dubUnavailable ? `${LANGUAGES.find(l => l.value === audioLang)?.label} audio not available` : "Video unavailable"}
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {dubUnavailable
                  ? "This episode may not have audio in that language. Try Japanese or switch Sub on."
                  : "The player link couldn't be loaded. Try another episode."}
              </p>
              {dubUnavailable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10 mt-1"
                  onClick={() => setAudioLang("japanese")}
                >
                  Switch to Japanese
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-[0_0_80px_-20px_rgba(139,92,246,0.25)]">
              <div className="aspect-video w-full">
                <iframe
                  src={episode.video_player}
                  allow="fullscreen; autoplay"
                  allowFullScreen
                  className="w-full h-full border-0"
                  title="Episode Player"
                  data-testid="iframe-player"
                />
              </div>
            </div>
          )}
        </div>

        {/* Nav row */}
        <div className="w-full mt-4 flex items-center justify-between gap-3 px-1">
          <Button
            variant="ghost"
            className="gap-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
            disabled={!episode?.prev_episode_id || isLoading}
            onClick={() => episode?.prev_episode_id && goToEpisode(episode.prev_episode_id)}
            data-testid="button-prev-episode"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Previous</span>
          </Button>

          <Button
            variant="ghost"
            className="gap-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
            disabled={!episode?.next_episode_id || isLoading}
            onClick={() => episode?.next_episode_id && goToEpisode(episode.next_episode_id)}
            data-testid="button-next-episode"
          >
            <span className="hidden sm:inline text-sm">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Language + Sub bar */}
        <div className="w-full mt-4 py-3 px-4 bg-white/3 border border-white/5 rounded-2xl">
          <LanguageBar
            audio={audioLang}
            sub={subEnabled}
            onAudio={setAudioLang}
            onSub={setSubEnabled}
          />
        </div>

        {/* Season episodes */}
        {seasonEpisodes.length > 0 && (
          <div className="w-full mt-8 space-y-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              Season {currentSeason} — Episodes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
              {seasonEpisodes.map((ep) => (
                <EpisodeItem
                  key={ep.id}
                  ep={ep}
                  isActive={ep.id === baseEpisodeId}
                  onClick={() => goToEpisode(ep.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="w-full mt-10 space-y-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
              You Might Also Like
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none" data-testid="recommendations-row">
              {recommendations.map((anime) => (
                <RecommendationCard key={anime.slug} anime={anime} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
