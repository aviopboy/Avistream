import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useGetAnimeEpisode, getGetAnimeEpisodeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export default function Watch() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/watch/:episodeId");
  const episodeId = params?.episodeId || "";

  // Derive series slug from episodeId (e.g. naruto-shippuden-7x144 -> naruto-shippuden)
  const slugMatch = episodeId.match(/^(.*?)-\d+x\d+$/);
  const seriesSlug = slugMatch ? slugMatch[1] : "";

  const { data: episodeResponse, isLoading, isError } = useGetAnimeEpisode(
    episodeId,
    { query: { enabled: !!episodeId, queryKey: getGetAnimeEpisodeQueryKey(episodeId) } }
  );

  const episode = episodeResponse?.data;

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <Link href={seriesSlug ? `/series/${seriesSlug}` : "/"}>
          <Button variant="ghost" className="gap-2 text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" /> Back to Series
          </Button>
        </Link>
        <div className="text-sm font-medium text-white/50 hidden sm:block">
          {episodeId}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[1600px] mx-auto px-4 md:px-6 pb-12">
        {isLoading ? (
          <div className="w-full aspect-video bg-secondary/30 rounded-xl border border-white/5 flex flex-col items-center justify-center text-primary animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium">Loading player...</p>
          </div>
        ) : isError || !episode?.video_player ? (
          <div className="w-full aspect-video bg-secondary/30 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-white mb-2">Video Unavailable</h2>
            <p className="max-w-md">The player link could not be loaded for this episode. Please try another episode or check back later.</p>
          </div>
        ) : (
          <div className="w-full relative shadow-[0_0_50px_-12px_rgba(139,92,246,0.15)] rounded-xl overflow-hidden bg-black ring-1 ring-white/10">
            <div className="aspect-video w-full">
              <iframe
                src={episode.video_player}
                allow="fullscreen"
                className="w-full h-full border-0"
                title="Episode Player"
              />
            </div>
          </div>
        )}

        <div className="w-full mt-6 flex items-center justify-between bg-secondary/20 p-4 rounded-xl border border-white/5 backdrop-blur">
          <Button 
            variant="outline" 
            className="gap-2 border-white/10 hover:bg-white/10 hover:text-white"
            disabled={!episode?.prev_episode_id || isLoading}
            onClick={() => episode?.prev_episode_id && setLocation(`/watch/${episode.prev_episode_id}`)}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Episode</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <Button 
            variant="outline" 
            className="gap-2 border-white/10 hover:bg-white/10 hover:text-white"
            disabled={!episode?.next_episode_id || isLoading}
            onClick={() => episode?.next_episode_id && setLocation(`/watch/${episode.next_episode_id}`)}
          >
            <span className="hidden sm:inline">Next Episode</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
