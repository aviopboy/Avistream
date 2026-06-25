import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
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

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location]);
  return null;
}

function Layout() {
  const [location] = useLocation();
  const watchPage = location.startsWith("/watch/");
  return (
    <>
      <ScrollToTop />
      {!watchPage && <Navbar />}
      <div className={!watchPage ? "pt-[60px]" : ""}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/anime" component={Anime} />
          <Route path="/movies" component={Movies} />
          <Route path="/series/:slug" component={Series} />
          <Route path="/watch/:episodeId" component={Watch} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
