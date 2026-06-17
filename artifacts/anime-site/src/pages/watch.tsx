import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle, Play, Tv } from "lucide-react";
import {
  useGetAnimeEpisode,
  getGetAnimeEpisodeQueryKey,
  useSearchAnime,
  getSearchAnimeQueryKey,
} from "@workspace/api-client-react";
import type { AnimeCard } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

type Lang = "sub" | "dub";
const LANG_KEY = "animesalt_lang";

function LangToggle({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/8 border border-white/10 rounded-full p-1" data-testid="lang-toggle">
      {(["sub", "dub"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          data-testid={`button-lang-${l}`}
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            value === l
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-white/40 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function RecommendationCard({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/series/${anime.slug}`} data-testid={`card-rec-${anime.slug}`}>
      <div className="group flex-shrink-0 w-32 space-y-2">
        <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/5 group-hover:border-primary/30 transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-[0_4px_24px_-6px_rgba(139,92,246,0.4)]">
          {anime.image ? (
            <img src={anime.image} alt={anime.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="w-6 h-6 text-white/20" />
            </div>
          )}
        </div>
        <p className="text-xs text-white/60 group-hover:text-white/90 transition-colors line-clamp-2 leading-snug text-center">
          {anime.title}
        </p>
      </div>
    </Link>
  );
}

export default function Watch() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/watch/:episodeId");
  const baseEpisodeId = params?.episodeId ?? "";

  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem(LANG_KEY) as Lang) ?? "sub"; } catch { return "sub"; }
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const episodeId = lang === "dub" ? `${baseEpisodeId}--dub` : baseEpisodeId;
  const slugMatch = baseEpisodeId.match(/^(.*?)-\d+x\d+$/);
  const seriesSlug = slugMatch ? slugMatch[1] : "";

  // Derive a short search keyword from the slug for recommendations
  const recKeyword = seriesSlug.split("-").slice(0, 2).join(" ");

  const { data: episodeResponse, isLoading, isError } = useGetAnimeEpisode(episodeId, {
    query: { enabled: !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) },
  });

  const { data: recData } = useSearchAnime(
    { q: recKeyword },
    { query: { enabled: !!recKeyword, queryKey: getSearchAnimeQueryKey({ q: recKeyword }) } }
  );

  const episode = episodeResponse?.data;
  const recommendations = (recData?.results ?? []).filter((r) => r.slug !== seriesSlug).slice(0, 12);

  const goToEpisode = (id: string) => setLocation(`/watch/${id}`);

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      {/* Minimal header — back button only */}
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

      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-4 md:px-6 pb-16 gap-0">
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
                {lang === "dub" ? "Dub not available" : "Video unavailable"}
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                {lang === "dub"
                  ? "This episode may not have an English dub. Try switching to Sub."
                  : "The player link couldn't be loaded. Try another episode."}
              </p>
              {lang === "dub" && (
                <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10 mt-1" onClick={() => setLang("sub")}>
                  Switch to Sub
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

        {/* Controls bar: prev | lang toggle | next */}
        <div className="w-full mt-4 flex items-center justify-between gap-4 px-1">
          <Button
            variant="ghost"
            className="gap-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
            disabled={!episode?.prev_episode_id || isLoading}
            onClick={() => episode?.prev_episode_id && goToEpisode(episode.prev_episode_id)}
            data-testid="button-prev-episode"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Previous</span>
          </Button>

          {/* Lang toggle — centred below player */}
          <LangToggle value={lang} onChange={setLang} />

          <Button
            variant="ghost"
            className="gap-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-20"
            disabled={!episode?.next_episode_id || isLoading}
            onClick={() => episode?.next_episode_id && goToEpisode(episode.next_episode_id)}
            data-testid="button-next-episode"
          >
            <span className="hidden sm:inline text-sm">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="w-full mt-10 space-y-4">
            <h2 className="text-base font-semibold text-white/80 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-primary fill-current" />
              You might also like
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
