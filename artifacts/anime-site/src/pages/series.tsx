import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Play, ListVideo, ChevronDown, Film } from "lucide-react";
import { useGetAnimeSeries, getGetAnimeSeriesQueryKey } from "@workspace/api-client-react";
import type { FlatEpisode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type GroupedSeason = { number: string; episodes: FlatEpisode[] };

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
      <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
        <div className="h-[320px] w-full animate-pulse" style={{ background: "hsl(var(--secondary))" }} />
        <div className="max-w-6xl mx-auto px-5 -mt-28 relative z-10 flex gap-6 pb-20">
          <Skeleton className="w-44 flex-shrink-0 bg-white/5" style={{ aspectRatio: "2/3", borderRadius: 12 }} />
          <div className="flex-1 mt-24 space-y-4">
            <Skeleton className="h-10 w-2/3 bg-white/5" />
            <Skeleton className="h-4 w-1/3 bg-white/5" />
            <Skeleton className="h-4 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Film className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Couldn&apos;t load this title</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Try watching from the beginning or go back home.</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href={`/watch/${slug}-1x1`}>
            <Button size="sm" className="gap-2 rounded-full" style={{ background: "hsl(var(--primary))", color: "#fff" }}>
              <Play className="w-3.5 h-3.5 fill-current" /> Try Episode 1
            </Button>
          </Link>
          <Link href="/"><Button variant="ghost" size="sm" className="rounded-full">← Home</Button></Link>
        </div>
      </div>
    );
  }

  const isMovie = series.is_movie === true;
  const moviePlayer = series.movie_players?.[0];
  const seasons = groupBySeason(series.episodes ?? []);
  const firstEp = seasons[0]?.episodes[0];
  const activeSeason = selectedSeason ?? seasons[0]?.number ?? null;
  const activeEpisodes = seasons.find((s) => s.number === activeSeason)?.episodes ?? [];

  return (
    <div className="min-h-screen pb-20" style={{ background: "hsl(var(--background))" }}>
      {/* Banner */}
      <div className="relative h-[320px] md:h-[380px] overflow-hidden"
        style={{ background: "hsl(var(--secondary))" }}>
        {series.thumbnail && (
          <img src={series.thumbnail} alt=""
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{ filter: "blur(0px)" }} />
        )}
        {/* Gradients */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(6,6,8,0.95) 0%, rgba(6,6,8,0.55) 55%, transparent 100%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(6,6,8,0.95) 100%)" }} />
      </div>

      {/* Poster + info row */}
      <div className="max-w-6xl mx-auto px-5 -mt-36 md:-mt-44 relative z-10 flex flex-col md:flex-row gap-6">
        {/* Poster */}
        <div className="w-40 md:w-52 flex-shrink-0 mx-auto md:mx-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl"
            style={{ border: "2px solid rgba(255,255,255,0.1)", background: "hsl(var(--secondary))" }}>
            {series.thumbnail && (
              <img src={series.thumbnail} alt={series.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 md:mt-28 text-center md:text-left space-y-3">
          {/* Badges row */}
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            {isMovie && (
              <span className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: "hsl(var(--primary))", color: "#fff" }}>MOVIE</span>
            )}
            {series.episodes && series.episodes.length > 0 && !isMovie && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "hsl(var(--muted-foreground))" }}>
                <ListVideo className="inline w-3 h-3 mr-1 mb-0.5" />
                {series.episodes.length} Episodes
              </span>
            )}
            {series.genres?.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded text-xs"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "hsl(var(--muted-foreground))" }}>
                {g}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight"
            data-testid="text-series-title">
            {series.title}
          </h1>

          {series.description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-4">
              {series.description}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 justify-center md:justify-start flex-wrap pt-1">
            {isMovie && moviePlayer ? (
              <Link href={`/watch/${slug}`}>
                <Button size="lg" className="rounded-full px-7 gap-2 font-bold"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}
                  data-testid="button-watch-movie">
                  <Play className="w-4 h-4 fill-white" /> Watch Movie
                </Button>
              </Link>
            ) : firstEp ? (
              <Link href={`/watch/${firstEp.id}`}>
                <Button size="lg" className="rounded-full px-7 gap-2 font-bold"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}
                  data-testid="button-start-watching">
                  <Play className="w-4 h-4 fill-white" /> Start Watching
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Episodes section */}
      {!isMovie && (
        <div className="max-w-6xl mx-auto px-5 mt-12">
          {seasons.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 rounded-xl"
              style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
              No episodes available yet.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-[3px] h-5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                  <h2 className="text-lg font-bold">Episodes</h2>
                </div>
                {seasons.length > 1 && (
                  <Select value={activeSeason ?? ""} onValueChange={setSelectedSeason}>
                    <SelectTrigger
                      className="w-40 rounded-lg text-sm"
                      style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
                      data-testid="select-season">
                      <div className="flex items-center gap-2">
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Season" />
                      </div>
                    </SelectTrigger>
                    <SelectContent style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                      {seasons.map((s) => (
                        <SelectItem key={s.number} value={s.number}
                          className="text-sm focus:bg-white/10"
                          data-testid={`option-season-${s.number}`}>
                          Season {s.number}
                          <span className="ml-2 text-muted-foreground text-xs">({s.episodes.length} eps)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Episode grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {activeEpisodes.map((ep) => (
                  <Link key={ep.id} href={`/watch/${ep.id}`} data-testid={`link-episode-${ep.id}`}>
                    <div className="group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                      style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--primary) / 0.4)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))"; }}>
                      {ep.thumbnail ? (
                        <div className="w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-black/20">
                          <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: "rgba(255,107,53,0.1)", color: "hsl(var(--primary))" }}>
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-muted-foreground mb-0.5">Ep {ep.number}</div>
                        <div className="text-sm font-medium text-white/80 truncate">
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
      )}
    </div>
  );
}
