import { useRoute, Link } from "wouter";
import { ArrowLeft, Play, ListVideo } from "lucide-react";
import { useGetAnimeSeries, getGetAnimeSeriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Series() {
  const [, params] = useRoute("/series/:slug");
  const slug = params?.slug ?? "";

  const { data: seriesResponse, isLoading, isError } = useGetAnimeSeries(slug, {
    query: { enabled: !!slug, queryKey: getGetAnimeSeriesQueryKey(slug) },
  });

  const series = seriesResponse?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] w-full bg-white/5 animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 pb-20">
          <div className="w-64 flex-shrink-0">
            <Skeleton className="w-full aspect-[2/3] rounded-xl shadow-2xl border-4 border-background bg-white/5" />
          </div>
          <div className="flex-1 mt-8 md:mt-32 space-y-6">
            <Skeleton className="h-12 w-3/4 bg-white/5" />
            <Skeleton className="h-6 w-1/4 bg-white/5" />
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-2/3 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
          <Play className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Series data unavailable</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            The series info couldn&apos;t be loaded from the API. You can still try watching from episode 1.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link href={`/watch/${slug}-1x1`}>
            <Button size="lg" className="rounded-full px-8 gap-2 font-semibold" data-testid="button-play-episode1">
              <Play className="w-4 h-4 fill-current" />
              Play Episode 1
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2 rounded-full" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstEpisode = series.seasons?.[0]?.episodes?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {series.image && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${series.image})` }}
          />
        )}
        <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <Link href="/" className="absolute top-6 left-6 z-20" data-testid="link-back">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 hover:bg-black/50 backdrop-blur border border-white/10 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-36 md:-mt-52 relative z-10 flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-44 md:w-64 flex-shrink-0 mx-auto md:mx-0">
          <div
            className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5"
            data-testid="img-series-poster"
          >
            {series.image && (
              <img src={series.image} alt={series.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 md:mt-36 space-y-5 text-center md:text-left">
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight"
            data-testid="text-series-title"
          >
            {series.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {series.total_episodes && (
              <Badge variant="secondary" className="bg-white/10 border-white/10 gap-1.5 py-1 text-white/70">
                <ListVideo className="w-3.5 h-3.5" />
                {series.total_episodes} Episodes
              </Badge>
            )}
            {series.genres?.map((genre) => (
              <Badge key={genre} variant="outline" className="border-white/10 text-white/60 py-1">
                {genre}
              </Badge>
            ))}
          </div>

          {series.description && (
            <p className="text-muted-foreground leading-relaxed text-sm max-w-2xl">
              {series.description}
            </p>
          )}

          {firstEpisode && (
            <div className="pt-2">
              <Link href={`/watch/${firstEpisode.id}`}>
                <Button
                  size="lg"
                  className="rounded-full px-8 gap-2 font-semibold shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)]"
                  data-testid="button-start-watching"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Watching
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Episodes */}
      <div className="max-w-6xl mx-auto px-6 mt-16 space-y-12">
        {series.seasons?.map((season) => (
          <div key={season.number} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-3 text-white">
              <span className="w-1 h-5 bg-primary rounded-full inline-block" />
              Season {season.number}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {season.episodes.map((ep) => (
                <Link key={ep.id} href={`/watch/${ep.id}`} data-testid={`link-episode-${ep.id}`}>
                  <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 rounded-xl p-4 transition-all flex items-center gap-4 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-medium mb-0.5">
                        Episode {ep.number}
                      </div>
                      <div className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
                        {ep.title ?? `Episode ${ep.number}`}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {(!series.seasons || series.seasons.length === 0) && (
          <div className="text-center text-muted-foreground py-16 border border-dashed border-white/10 rounded-2xl">
            No episodes available yet.
          </div>
        )}
      </div>
    </div>
  );
}
