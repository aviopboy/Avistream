import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ANIMESALT_BASE = "https://animesalt-api-lovat.vercel.app/api";

router.get("/anime/search", async (req, res) => {
  const q = req.query["q"];
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Missing query parameter: q" });
    return;
  }
  try {
    const upstream = await fetch(`${ANIMESALT_BASE}/search?q=${encodeURIComponent(q)}`);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch search results");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

router.get("/anime/series/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const upstream = await fetch(`${ANIMESALT_BASE}/series/${encodeURIComponent(slug)}`);
    if (upstream.status === 404) {
      res.status(404).json({ error: "Series not found" });
      return;
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch series");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

router.get("/anime/episode/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  try {
    const upstream = await fetch(`${ANIMESALT_BASE}/episode/${encodeURIComponent(episodeId)}`);
    if (upstream.status === 404) {
      res.status(404).json({ error: "Episode not found" });
      return;
    }
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch episode");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

export default router;
