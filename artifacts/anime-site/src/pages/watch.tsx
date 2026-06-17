import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useGetAnimeEpisode, getGetAnimeEpisodeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

type Lang = "sub" | "dub";

const LANG_KEY = "animesalt_lang";

function LangToggle({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1" data-testid="lang-toggle">
      {(["sub", "dub"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          data-testid={`button-lang-${l}`}
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            value === l
              ? "bg-primary text-primary-foreground shadow"
              : "text-white/50 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Watch() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/watch/:episodeId");
  const baseEpisodeId = params?.episodeId ?? "";

  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem(LANG_KEY) as Lang) ?? "sub";
    } catch {
      return "sub";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch { /* ignore */ }
  }, [lang]);

  const episodeId = lang === "dub" ? `${baseEpisodeId}--dub` : baseEpisodeId;

  const slugMatch = baseEpisodeId.match(/^(.*?)-\d+x\d+$/);
  const seriesSlug = slugMatch ? slugMatch[1] : "";

  const { data: episodeResponse, isLoading, isError } = useGetAnimeEpisode(episodeId, {
    query: { enabled: !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) },
  });

  const episode = episodeResponse?.data;

  const goToEpisode = (id: string) => {
    setLocation(`/watch/${id}`);
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-4 md:px-6 py-4 flex items-center justify-between z-10">
        <Link href={seriesSlug ? `/series/${seriesSlug}` : "/"} data-testid="link-back">
          <Button variant="ghost" className="gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back to Series</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 hidden md:block font-mono">{baseEpisodeId}</span>
          <LangToggle value={lang} onChange={setLang} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full max-w-[1600px] mx-auto px-4 md:px-6 pb-10 gap-4">
        {/* Player */}
        <div className="w-full">
          {isLoading ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-10 h-10 animate-spin mb-3 opacity-60" />
              <p className="text-sm text-white/40">Loading player...</p>
            </div>
          ) : isError || !episode?.video_player ? (
            <div className="w-full aspect-video bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 opacity-40" />
              <h2 className="text-lg font-semibold text-white">
                {lang === "dub" ? "Dub not available for this episode" : "Video unavailable"}
              </h2>
              <p className="max-w-md text-sm">
                {lang === "dub"
                  ? "Try switching back to Sub, or this anime may not have an English dub."
                  : "The player link couldn't be loaded. Try another episode or check back later."}
              </p>
              {lang === "dub" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10 mt-2"
                  onClick={() => setLang("sub")}
                >
                  Switch to Sub
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-[0_0_60px_-15px_rgba(139,92,246,0.2)]">
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

        {/* Nav bar */}
        <div className="w-full flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5">
          <Button
            variant="ghost"
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            disabled={!episode?.prev_episode_id || isLoading}
            onClick={() => episode?.prev_episode_id && goToEpisode(episode.prev_episode_id)}
            data-testid="button-prev-episode"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Previous</span>
          </Button>

          <span className="text-xs text-white/30 text-center px-2 hidden sm:block">
            {lang === "dub" ? "Dubbed" : "Subbed"}
          </span>

          <Button
            variant="ghost"
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30"
            disabled={!episode?.next_episode_id || isLoading}
            onClick={() => episode?.next_episode_id && goToEpisode(episode.next_episode_id)}
            data-testid="button-next-episode"
          >
            <span className="hidden sm:inline text-sm">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
