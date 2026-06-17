import { useState } from "react";
import { Link } from "wouter";
import { Film, Search, Tv } from "lucide-react";
import { useGetAnimeHome, useSearchAnime, getSearchAnimeQueryKey } from "@workspace/api-client-react";
import type { AnimeCard } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

function MovieCard({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/series/${anime.slug}`}>
      <div className="group relative rounded-lg overflow-hidden bg-secondary cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
        <div className="aspect-[2/3] overflow-hidden">
          {anime.image ? (
            <img src={anime.image} alt={anime.title}
              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity duration-200"
              loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Tv className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        {/* Movie badge */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}>
            MOVIE
          </span>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold text-white/80 truncate">{anime.title}</p>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full bg-white/5" />
      <div className="p-2"><Skeleton className="h-3 w-3/4 bg-white/5" /></div>
    </div>
  );
}

export default function Movies() {
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounce(query, 350);
  const isSearching = debouncedQ.length > 1;

  const { data: homeData, isLoading: homeLoading } = useGetAnimeHome();
  const { data: searchData, isLoading: searchLoading } = useSearchAnime(
    { q: debouncedQ },
    { query: { enabled: isSearching, queryKey: getSearchAnimeQueryKey({ q: debouncedQ }) } }
  );

  const homeMovies = homeData?.data?.movies ?? [];
  const searchMovies = searchData?.results?.filter((r) =>
    r.title.toLowerCase().includes("movie") || r.slug.includes("movie")
  ) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-6 rounded-full" style={{ background: "hsl(var(--primary))" }} />
          <Film className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Anime Movies</h1>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-colors"
            style={{
              background: "hsl(var(--secondary))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
            data-testid="input-movies-search"
          />
        </div>

        {/* Grid */}
        {isSearching ? (
          searchLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : searchMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {searchMovies.map((a) => <MovieCard key={a.slug} anime={a} />)}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              No movies found for &quot;{debouncedQ}&quot;
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {homeLoading
              ? Array.from({ length: 18 }).map((_, i) => <CardSkeleton key={i} />)
              : homeMovies.map((a) => <MovieCard key={a.slug} anime={a} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}
