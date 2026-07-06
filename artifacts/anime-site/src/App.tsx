import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Anime from "@/pages/anime";
import Movies from "@/pages/movies";
import Series from "@/pages/series";
import Watch from "@/pages/watch";
import Genre from "@/pages/genre";
import { useTheme, ThemeContext, applyTheme } from "@/hooks/use-theme";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);
  return null;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

function Layout() {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const watchPage = location.startsWith("/watch/");

  return (
    <>
      <ScrollToTop />
      {!watchPage && <Navbar settingsOpen={settingsOpen} onSettingsToggle={() => setSettingsOpen((v) => !v)} onSettingsClose={() => setSettingsOpen(false)} />}
      <div className={!watchPage ? "pt-[60px]" : ""}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/anime" component={Anime} />
          <Route path="/movies" component={Movies} />
          <Route path="/series/:slug" component={Series} />
          <Route path="/watch/:episodeId" component={Watch} />
          <Route path="/genre/:name" component={Genre} />
          <Route path="/genre" component={Genre} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  useEffect(() => {
    try {
      const r = localStorage.getItem("avistream_theme");
      if (r) applyTheme(JSON.parse(r) as Parameters<typeof applyTheme>[0]);
    } catch { /* ignore */ }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout />
          </WouterRouter>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
