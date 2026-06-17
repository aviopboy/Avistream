import { useState } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Play, ListVideo, ChevronDown } from "lucide-react";
import { useGetAnimeSeries, getGetAnimeSeriesQueryKey } from "@workspace/api-client-react";
import type { FlatEpisode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GroupedSeason = {
  number: string;
  episodes: FlatEpisode[];
};

function groupBySeason(episodes: FlatEpisode[]): GroupedSeason[] {
  const map = new Map<string, GroupedSeason>();
  for (const ep of episodes) {
    const s = ep.season ?? "1";
    if (!map.has(s)) map.set(s, { number: s, episodes: [] });
    map.get(s)!.episodes.push(ep);
  }
  return Array.from(map.values()).sort((a, b) => Number(a.number) - Number(b.number));
}

export default function Series() {
  const [, params] = useRoute("/series/:slug");
  const slug = params?.slug ?? "";
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const { data: seriesResponse, isLoading, isError } = useGetAnimeSeries(slug, {
    query: { enabled: !!slug, queryKey: getGetAnimeSeriesQueryKey(slug) },
  });

  const series = seriesResponse?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] w-full bg-white/5 animate-pulse" />
        <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 pb-20">
          <Skeleton className="w-48 md:w-64 aspect-[2/3] flex-shrink-0 rounded-2xl bg-white/5" />
          <div className="flex-1 mt-8 md:mt-32 space-y-5">
            <Skeleton className="h-12 w-3/4 bg-white/5" />
            <Skeleton className="h-5 w-1/4 bg-white/5" />
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
            Couldn&apos;t load series info. You can still try watching from episode 1.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/watch/${slug}-1x1`}>
            <Button size="lg" className="rounded-full px-8 gap-2 font-semibold" data-testid="button-play-episode1">
              <Play className="w-4 h-4 fill-current" /> Play Episode 1
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

  const seasons = groupBySeason(series.episodes ?? []);
  const firstEp = seasons[0]?.episodes[0];
  const activeSeason = selectedSeason ?? seasons[0]?.number ?? null;
  const activeEpisodes = seasons.find((s) => s.number === activeSeason)?.episodes ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero backdrop */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {series.thumbnail && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110"
            style={{ backgroundImage: `url(${series.thumbnail})` }}
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

      {/* Poster + info */}
      <div className="max-w-6xl mx-auto px-6 -mt-36 md:-mt-52 relative z-10 flex flex-col md:flex-row gap-8">
        <div className="w-44 md:w-64 flex-shrink-0 mx-auto md:mx-0">
          <div
            className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5"
            data-testid="img-series-poster"
          >
            {series.thumbnail && (
              <img src={series.thumbnail} alt={series.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        <div className="flex-1 md:mt-36 space-y-5 text-center md:text-left">
          <h1
            className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight"
            data-testid="text-series-title"
          >
            {series.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {series.episodes && series.episodes.length > 0 && (
              <Badge variant="secondary" className="bg-white/10 border-white/10 gap-1.5 py-1 text-white/70">
                <ListVideo className="w-3.5 h-3.5" />
                {series.episodes.length} Episodes
              </Badge>
            )}
            {series.is_movie && (
              <Badge variant="secondary" className="bg-primary/20 border-primary/30 py-1 text-primary">
                Movie
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

          {firstEp && (
            <div className="pt-2">
              <Link href={`/watch/${firstEp.id}`}>
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

      {/* Episodes section */}
      <div className="max-w-6xl mx-auto px-6 mt-16">
        {seasons.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 border border-dashed border-white/10 rounded-2xl">
            No episodes available yet.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Season selector header */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                Episodes
              </h2>
              {seasons.length > 1 && (
                <Select
                  value={activeSeason ?? ""}
                  onValueChange={setSelectedSeason}
                >
                  <SelectTrigger
                    className="w-40 bg-white/5 border-white/10 text-white rounded-xl focus:ring-primary/50"
                    data-testid="select-season"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Season" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/10">
                    {seasons.map((s) => (
                      <SelectItem
                        key={s.number}
                        value={s.number}
                        className="text-white/80 hover:text-white focus:bg-white/10 focus:text-white"
                        data-testid={`option-season-${s.number}`}
                      >
                        Season {s.number}
                        <span className="ml-2 text-muted-foreground text-xs">
                          ({s.episodes.length} eps)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Episode grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeEpisodes.map((ep) => (
                <Link key={ep.id} href={`/watch/${ep.id}`} data-testid={`link-episode-${ep.id}`}>
                  <div className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 rounded-xl p-3 transition-all flex items-center gap-3 cursor-pointer">
                    {ep.thumbnail ? (
                      <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                        <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground font-medium mb-0.5">
                        Ep {ep.number}
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
        )}
      </div>
    </div>
  );
}
