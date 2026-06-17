import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ANIMESALT_BASE = "https://animesalt-api-lovat.vercel.app/api";

async function proxyUpstream(url: string): Promise<{ status: number; body: unknown }> {
  const upstream = await fetch(url);
  const body = await upstream.json() as unknown;
  if (
    upstream.status === 404 ||
    (typeof body === "object" && body !== null && "detail" in body)
  ) {
    return { status: 404, body: { error: "Not found" } };
  }
  return { status: upstream.status, body };
}

router.get("/anime/home", async (req, res) => {
  try {
    const upstream = await fetch(`${ANIMESALT_BASE}/home`);
    const raw = await upstream.json() as Record<string, unknown>;
    const data = raw["data"] as Record<string, unknown> | undefined;
    const normalized = {
      success: true,
      data: {
        fresh_drops: (data?.["fresh_drops"] ?? []) as unknown[],
        on_air: (data?.["on-air_series_view_more"] ?? []) as unknown[],
      },
    };
    res.json(normalized);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch home");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

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
    const result = await proxyUpstream(`${ANIMESALT_BASE}/series/${encodeURIComponent(slug)}`);
    res.status(result.status).json(result.body);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch series");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

router.get("/anime/episode/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  try {
    const result = await proxyUpstream(`${ANIMESALT_BASE}/episode/${encodeURIComponent(episodeId)}`);
    res.status(result.status).json(result.body);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch episode");
    res.status(502).json({ error: "Failed to reach AnimeSalt API" });
  }
});

export default router;
