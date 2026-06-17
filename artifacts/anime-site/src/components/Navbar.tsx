import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Tv } from "lucide-react";
import { useSearchAnime, getSearchAnimeQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Anime" },
  { href: "/movies", label: "Movies" },
];

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(query, 350);
  const { data: searchData } = useSearchAnime(
    { q: debouncedQ },
    { query: { enabled: debouncedQ.length > 1, queryKey: getSearchAnimeQueryKey({ q: debouncedQ }) } }
  );

  const results = searchData?.results?.slice(0, 6) ?? [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(slug: string) {
    setQuery("");
    setDropOpen(false);
    setMobileOpen(false);
    setLocation(`/series/${slug}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length > 1) {
      setLocation(`/anime?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setDropOpen(false);
    }
  }

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center gap-3 px-4 md:px-6"
        style={{
          background: "rgba(6,6,8,0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 select-none">
          <span className="text-xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.5px" }}>
            <span className="text-primary">Anime</span>
            <span className="text-foreground">Salt</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={dropRef} className="flex-1 max-w-md relative hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropOpen(e.target.value.length > 1); }}
                onFocus={() => { if (query.length > 1) setDropOpen(true); }}
                placeholder="Search anime..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                data-testid="input-nav-search"
              />
            </div>
          </form>

          {/* Dropdown */}
          {dropOpen && results.length > 0 && (
            <div
              className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 rounded-xl overflow-hidden overflow-y-auto max-h-[400px]"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              {results.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => handleSelect(r.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <div className="w-9 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                    {r.image ? (
                      <img src={r.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground line-clamp-2">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <span
                className="px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer"
                style={{
                  color: isActive(l.href) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive(l.href) ? "hsl(var(--primary) / 0.12)" : "transparent",
                }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="ml-auto md:hidden p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed top-[60px] left-0 right-0 z-40 px-4 pt-3 pb-4 flex flex-col gap-1"
          style={{
            background: "hsl(var(--card))",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
            </div>
          </form>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
              <span
                className="block px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  color: isActive(l.href) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive(l.href) ? "hsl(var(--primary) / 0.12)" : "transparent",
                }}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
