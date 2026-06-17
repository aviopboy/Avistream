import { useState } from "react";
import { Link } from "wouter";
import { Search, Film, Play } from "lucide-react";
import { useSearchAnime, getSearchAnimeQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const { data: searchData, isLoading } = useSearchAnime(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 2, queryKey: getSearchAnimeQueryKey({ q: debouncedQuery }) } }
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Cinematic background gradient glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <header className="px-6 py-8 md:px-12 md:py-12 z-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          AnimeSalt
        </h1>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
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
            className="w-full pl-12 pr-4 py-6 text-lg rounded-2xl bg-secondary/50 border-border/50 focus-visible:ring-primary/50 focus-visible:bg-secondary/80 transition-all backdrop-blur-sm"
            placeholder="Search for anime (e.g. Naruto, Bleach)..."
          />
        </div>
      </header>

      <main className="flex-1 px-6 md:px-12 pb-24 z-10 w-full max-w-7xl mx-auto">
        {debouncedQuery.length <= 2 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6 opacity-60">
            <Film className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-medium text-muted-foreground">What are we watching tonight?</h2>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-xl bg-secondary" />
                <Skeleton className="h-4 w-3/4 bg-secondary" />
              </div>
            ))}
          </div>
        ) : searchData?.results && searchData.results.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              Search Results
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {searchData.results.map((anime, index) => (
                <Link
                  key={anime.slug}
                  href={`/series/${anime.slug}`}
                  className="group flex flex-col space-y-3 relative outline-none animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="overflow-hidden rounded-xl aspect-[2/3] relative bg-secondary border border-white/5 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background">
                    {anime.image ? (
                      <img
                        src={anime.image}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <Film className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {anime.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-center space-y-4">
            <p className="text-xl text-muted-foreground">No results found for "{debouncedQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}
