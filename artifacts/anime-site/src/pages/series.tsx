import { useRoute, Link } from "wouter";
import { ArrowLeft, Play, Calendar, ListVideo } from "lucide-react";
import { useGetAnimeSeries, getGetAnimeSeriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Series() {
  const [, params] = useRoute("/series/:slug");
  const slug = params?.slug || "";

  const { data: seriesResponse, isLoading, isError } = useGetAnimeSeries(
    slug,
    { query: { enabled: !!slug, queryKey: getGetAnimeSeriesQueryKey(slug) } }
  );

  const series = seriesResponse?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] w-full bg-secondary animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 pb-20">
          <div className="w-64 flex-shrink-0">
            <Skeleton className="w-full aspect-[2/3] rounded-xl shadow-2xl border-4 border-background bg-secondary" />
          </div>
          <div className="flex-1 mt-8 md:mt-32 space-y-6">
            <Skeleton className="h-12 w-3/4 bg-secondary" />
            <Skeleton className="h-6 w-1/4 bg-secondary" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-secondary" />
              <Skeleton className="h-4 w-full bg-secondary" />
              <Skeleton className="h-4 w-2/3 bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h2 className="text-2xl font-bold">Series not found</h2>
        <p className="text-muted-foreground max-w-md">We couldn't find the anime you're looking for. It might have been removed or the link is broken.</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  const firstEpisode = series.seasons?.[0]?.episodes?.[0];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Header with blurred backdrop */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {series.image && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${series.image})` }}
          />
        )}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <Link href="/" className="absolute top-6 left-6 z-20">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/40 backdrop-blur border-white/10 text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 md:-mt-48 relative z-10 flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-48 md:w-72 flex-shrink-0 mx-auto md:mx-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-background bg-secondary relative">
            {series.image && (
              <img src={series.image} alt={series.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 md:mt-32 space-y-6 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            {series.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {series.total_episodes && (
              <Badge variant="secondary" className="bg-secondary/50 backdrop-blur border-white/5 gap-1.5 py-1">
                <ListVideo className="w-3.5 h-3.5" />
                {series.total_episodes} Episodes
              </Badge>
            )}
            {series.genres?.map(genre => (
              <Badge key={genre} variant="outline" className="border-white/10 text-white/70 py-1">
                {genre}
              </Badge>
            ))}
          </div>

          {series.description && (
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-3xl">
              {series.description}
            </p>
          )}

          {firstEpisode && (
            <div className="pt-2">
              <Link href={`/watch/${firstEpisode.id}`}>
                <Button size="lg" className="w-full md:w-auto rounded-full px-8 gap-2 font-semibold shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">
                  <Play className="w-5 h-5 fill-current" />
                  Start Watching
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Episodes List */}
      <div className="max-w-6xl mx-auto px-6 mt-16 space-y-12">
        {series.seasons?.map(season => (
          <div key={season.number} className="space-y-6">
            <h3 className="text-xl font-medium flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              Season {season.number}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {season.episodes.map(ep => (
                <Link key={ep.id} href={`/watch/${ep.id}`}>
                  <div className="group bg-secondary/30 hover:bg-secondary/60 border border-white/5 rounded-lg p-4 transition-all hover:border-primary/30 flex items-center gap-4 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-medium mb-1">
                        Episode {ep.number}
                      </div>
                      <div className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">
                        {ep.title || `Episode ${ep.number}`}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {(!series.seasons || series.seasons.length === 0) && (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-white/10 rounded-xl">
            No episodes available for this series yet.
          </div>
        )}
      </div>
    </div>
  );
}
