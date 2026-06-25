import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, Tv, Settings, User } from "lucide-react";
import { useSearchAnime, getSearchAnimeQueryKey } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { SettingsModal } from "@/components/SettingsModal";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Anime" },
  { href: "/movies", label: "Movies" },
];

type NavbarProps = {
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  onSettingsClose: () => void;
};

export function Navbar({ settingsOpen, onSettingsToggle, onSettingsClose }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const debouncedQ = useDebounce(query, 350);
  const { data: searchData } = useSearchAnime(
    { q: debouncedQ },
    { query: { enabled: debouncedQ.length > 1, queryKey: getSearchAnimeQueryKey({ q: debouncedQ }) } }
  );
  const results = searchData?.results?.slice(0, 6) ?? [];

  function handleSelect(slug: string) {
    setQuery("");
    setMobileOpen(false);
    setMobileSearchOpen(false);
    setLocation(`/series/${slug}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length > 1) {
      setLocation(`/anime?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setMobileSearchOpen(false);
      setMobileOpen(false);
    }
  }

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center gap-2 px-4 md:px-6"
        style={{
          background: "rgba(6,6,8,0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 select-none mr-2">
          <span className="text-xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.5px" }}>
            <span className="text-primary">Avi</span>
            <span className="text-foreground">Stream</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <span className="px-3.5 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer"
                style={{
                  color: isActive(l.href) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive(l.href) ? "hsl(var(--primary) / 0.12)" : "transparent",
                }}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1">
          {/* Mobile search toggle */}
          <button
            onClick={() => { setMobileSearchOpen((v) => !v); setMobileOpen(false); }}
            className="p-2 rounded-lg transition-colors md:hidden"
            style={{ color: "hsl(var(--muted-foreground))" }}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Account — always visible */}
          <button
            onClick={() => { onSettingsToggle(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border hidden md:flex"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            title="Account (Coming Soon)"
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsToggle}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: settingsOpen ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => { setMobileOpen((v) => !v); setMobileSearchOpen(false); }}
            className="p-2 rounded-lg transition-colors md:hidden"
            style={{ color: "hsl(var(--muted-foreground))" }}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={onSettingsClose} />}

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="fixed top-[60px] left-0 right-0 z-40 px-4 py-3 md:hidden"
          style={{ background: "rgba(6,6,8,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid hsl(var(--border))" }}>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setMobileSearchOpen(false); setQuery(""); } }}
                placeholder="Search anime..."
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl outline-none"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  fontSize: "16px",
                }}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
          {results.length > 0 && debouncedQ.length > 1 && (
            <div className="mt-2 rounded-xl overflow-hidden overflow-y-auto max-h-[50vh]"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              {results.map((r) => (
                <button key={r.slug} onClick={() => handleSelect(r.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 active:bg-white/10">
                  <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                    {r.image
                      ? <img src={r.image} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Tv className="w-4 h-4 text-white/30" /></div>}
                  </div>
                  <span className="text-sm font-medium text-foreground line-clamp-2">{r.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile nav links */}
      {mobileOpen && (
        <div className="fixed top-[60px] left-0 right-0 z-40 px-4 pt-3 pb-4 flex flex-col gap-1 md:hidden"
          style={{ background: "hsl(var(--card))", borderBottom: "1px solid hsl(var(--border))" }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
              <span className="block px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                style={{
                  color: isActive(l.href) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: isActive(l.href) ? "hsl(var(--primary) / 0.12)" : "transparent",
                }}>
                {l.label}
              </span>
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t flex flex-col gap-1" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => { setMobileOpen(false); onSettingsToggle(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left"
              style={{ color: "hsl(var(--muted-foreground))" }}>
              <User className="w-4 h-4" /> Account <span className="ml-auto text-[10px] text-white/30">Coming Soon</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
