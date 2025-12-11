import express from "express";
import fetch from "node-fetch";

const app = express();

// Read your API key from Vercel environment
const YT_API_KEY = process.env.YT_API_KEY;

// Function to search YouTube playlists
async function searchYouTubePlaylists(query) {
  if (!YT_API_KEY) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=15&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;

  const data = await fetch(url).then(res => res.json()).catch(err => {
    console.error("YouTube API error:", err);
    return {};
  });

  if (!data.items) return [];

  return data.items.map(item => ({
    id: "ytpl_" + item.id.playlistId,
    type: "series",
    name: item.snippet.title,
    poster: item.snippet.thumbnails?.high?.url || "",
  }));
}

// Stremio catalog endpoint
app.get("/catalog/:type/:id/search=:query", async (req, res) => {
  let query = req.params.query;

  // In some Stremio versions, query comes via extra args
  if (!query && req.query && req.query.extra) {
    query = req.query.extra.search || "";
  }

  if (!query) return res.json({ metas: [] });

  const metas = await searchYouTubePlaylists(query);
  res.json({ metas });
});

// Root test route
app.get("/", (req, res) => {
  res.send("YouTube Playlist Addon Running");
});

// Manifest for Stremio
app.get("/manifest.json", (req, res) => {
  res.json({
    id: "youtube-playlist-search",
    version: "1.0.0",
    name: "YouTube Playlist Search",
    description: "Search and watch YouTube playlists in Stremio",
    catalogs: [
      { type: "series", id: "youtube", name: "YouTube Playlists" }
    ],
    resources: ["catalog"],
    types: ["series"],
    idPrefixes: ["ytpl_"]
  });
});

export default app;