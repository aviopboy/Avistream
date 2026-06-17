import { useState } from "react";
import { Link } from "wouter";
import { Search, Play, Flame, Tv } from "lucide-react";
import {
  useSearchAnime,
  getSearchAnimeQueryKey,
  useGetAnimeHome,
} from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnimeCard } from "@workspace/api-client-react";

function PosterCard({ anime, index }: { anime: AnimeCard; index: number }) {
  return (
    <Link
      key={anime.slug}
      href={`/series/${anime.slug}`}
      data-testid={`card-anime-${anime.slug}`}
      className="group flex flex-col space-y-3 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="overflow-hidden rounded-xl aspect-[2/3] relative bg-secondary border border-white/5 transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-[0_8px_40px_-8px_rgba(139,92,246,0.5)] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background">
        {anime.image ? (
          <img
            src={anime.image}
            alt={anime.title}
            className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Tv className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-5">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-xl transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="h-4 w-4 fill-current" />
          </div>
        </div>
      </div>
      <h4 className="font-medium text-sm leading-snug line-clamp-2 text-white/80 group-hover:text-primary transition-colors duration-200">
        {anime.title}
      </h4>
    </Link>
  );
}

function PosterSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="aspect-[2/3] w-full rounded-xl bg-white/5" />
      <Skeleton className="h-4 w-3/4 bg-white/5" />
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold flex items-center gap-2.5 text-white">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const isSearching = debouncedQuery.length > 1;

  const { data: searchData, isLoading: searchLoading } = useSearchAnime(
    { q: debouncedQuery },
    {
      query: {
        enabled: isSearching,
        queryKey: getSearchAnimeQueryKey({ q: debouncedQuery }),
      },
    }
  );

  const { data: homeData, isLoading: homeLoading } = useGetAnimeHome();

  const freshDrops = homeData?.data?.fresh_drops ?? [];
  const onAir = homeData?.data?.on_air ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/15 blur-[140px] rounded-full" />

      {/* Header */}
      <header className="px-6 pt-12 pb-8 md:px-12 md:pt-16 z-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-3 text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
          AnimeSalt
        </h1>
        <p className="text-muted-foreground text-center mb-10 max-w-md text-sm">
          Immersive anime streaming. Dive into your midnight marathon.
        </p>

        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-search"
            className="w-full pl-12 pr-4 py-6 text-base rounded-2xl bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:bg-white/8 transition-all backdrop-blur-sm placeholder:text-white/30"
            placeholder="Search anime..."
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 md:px-12 pb-24 z-10 w-full max-w-7xl mx-auto space-y-12">
        {isSearching ? (
          <>
            {searchLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <PosterSkeleton key={i} />
                ))}
              </div>
            ) : searchData?.results && searchData.results.length > 0 ? (
              <Section title="Search Results" icon={<Search className="h-4 w-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {searchData.results.map((anime, i) => (
                    <PosterCard key={anime.slug} anime={anime} index={i} />
                  ))}
                </div>
              </Section>
            ) : (
              <div className="flex flex-col items-center justify-center mt-16 text-center space-y-3">
                <p className="text-muted-foreground">No results for &quot;{debouncedQuery}&quot;</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Fresh Drops */}
            <Section title="Fresh Drops" icon={<Flame className="h-4 w-4" />}>
              {homeLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <PosterSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {freshDrops.map((anime, i) => (
                    <PosterCard key={anime.slug} anime={anime} index={i} />
                  ))}
                </div>
              )}
            </Section>

            {/* On Air */}
            {(homeLoading || onAir.length > 0) && (
              <Section title="On Air" icon={<Tv className="h-4 w-4" />}>
                {homeLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <PosterSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {onAir.map((anime, i) => (
                      <PosterCard key={anime.slug} anime={anime} index={i} />
                    ))}
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
