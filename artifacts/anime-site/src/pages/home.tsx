import { useEffect } from "react";
import { Link } from "wouter";
import { Play, Flame, Tv, Sparkles, Film, Clock, Bookmark } from "lucide-react";
import { useGetAnimeHome } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnimeCard } from "@workspace/api-client-react";
import { useRecentWatched } from "@/hooks/use-recent-watched";
import { useBookmarks } from "@/hooks/use-bookmarks";

function Card({ anime }: { anime: AnimeCard }) {
  return (
    <Link href={`/series/${anime.slug}`} data-testid={`card-${anime.slug}`}>
      <div className="group relative rounded-lg overflow-hidden bg-secondary cursor-pointer transition-transform duration-200 hover:-translate-y-1"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
        <div className="aspect-[2/3] overflow-hidden">
          {anime.image ? (
            <img src={anime.image} alt={anime.title}
              className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-75" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Tv className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}>
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold text-white/80 truncate leading-tight">{anime.title}</p>
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

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-[3px] h-5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <span className="text-primary">{icon}</span>{title}
      </h2>
    </div>
  );
}

function GridSection({ title, icon, items, loading }: {
  title: string; icon: React.ReactNode; items: AnimeCard[]; loading: boolean;
}) {
  return (
    <section>
      <SectionHeader title={title} icon={icon} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {loading ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />) : items.map((a) => <Card key={a.slug} anime={a} />)}
      </div>
    </section>
  );
}

function ScrollSection({ title, icon, items, loading }: {
  title: string; icon: React.ReactNode; items: AnimeCard[]; loading: boolean;
}) {
  return (
    <section>
      <SectionHeader title={title} icon={icon} />
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="flex-shrink-0 w-[130px]"><CardSkeleton /></div>)
          : items.map((a) => <div key={a.slug} className="flex-shrink-0 w-[130px]"><Card anime={a} /></div>)
        }
      </div>
    </section>
  );
}

function BookmarkCard({ slug, title, image, episodeId, episodeTitle }: {
  slug: string; title: string; image: string | null; episodeId: string; episodeTitle: string;
}) {
  return (
    <Link href={`/watch/${episodeId}`}>
      <div className="group flex-shrink-0 w-[160px] rounded-xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-1"
        style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
        <div className="w-full aspect-[16/9] overflow-hidden relative bg-black/40">
          {image
            ? <img src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center"><Tv className="w-6 h-6 text-white/20" /></div>
          }
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "hsl(var(--primary))" }}>
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="p-2.5 space-y-0.5">
          <p className="text-xs font-semibold text-white/90 truncate">{title}</p>
          <p className="text-[10px] text-muted-foreground truncate">{episodeTitle}</p>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { data: homeData, isLoading } = useGetAnimeHome();
  const { items: recentItems, refresh } = useRecentWatched();
  const { items: bookmarkItems } = useBookmarks();

  useEffect(() => { refresh(); }, [refresh]);

  const freshDrops = homeData?.data?.fresh_drops ?? [];
  const onAir = homeData?.data?.on_air ?? [];
  const newArrivals = homeData?.data?.new_arrivals ?? [];
  const movies = homeData?.data?.movies ?? [];

  const recentCards: AnimeCard[] = recentItems.map((r) => ({
    slug: r.slug, title: r.title, image: r.image, url: null,
  }));

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-12">

        {/* Bookmarks */}
        {bookmarkItems.length > 0 && (
          <section>
            <SectionHeader title="Bookmarks" icon={<Bookmark className="w-4 h-4" />} />
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {bookmarkItems.map((b) => (
                <BookmarkCard key={b.episodeId} slug={b.seriesSlug} title={b.seriesTitle}
                  image={b.seriesImage} episodeId={b.episodeId} episodeTitle={b.episodeTitle} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Watched */}
        {recentCards.length > 0 && (
          <ScrollSection title="Recently Watched" icon={<Clock className="w-4 h-4" />} items={recentCards} loading={false} />
        )}

        {/* Fresh Drops */}
        <GridSection title="Fresh Drops" icon={<Flame className="w-4 h-4" />} items={freshDrops} loading={isLoading} />

        {/* Trending */}
        <ScrollSection title="Trending Now" icon={<Sparkles className="w-4 h-4" />} items={onAir} loading={isLoading} />

        {/* Popular */}
        <ScrollSection title="All Time Popular" icon={<Tv className="w-4 h-4" />} items={newArrivals} loading={isLoading} />

        {/* Movies */}
        {(isLoading || movies.length > 0) && (
          <ScrollSection title="Anime Movies" icon={<Film className="w-4 h-4" />} items={movies} loading={isLoading} />
        )}
      </main>
    </div>
  );
}
