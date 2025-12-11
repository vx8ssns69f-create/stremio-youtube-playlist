import express from "express";
import fetch from "node-fetch";

const app = express();

// YouTube search API endpoint (NO API KEY needed)
async function searchYouTubePlaylists(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D`; 
  const html = await fetch(url).then(r => r.text());

  const playlistRegex = /"playlistId":"(.*?)".*?"title":{"simpleText":"(.*?)"}/g;
  let result = [];
  let match;

  while ((match = playlistRegex.exec(html)) !== null) {
    result.push({
      id: "ytpl_" + match[1],
      name: match[2],
      type: "series",
      poster: "https://i.ytimg.com/vi/" + match[1] + "/hqdefault.jpg"
    });
  }

  return result.slice(0, 20); // limit results
}

// API ROUTE
app.get("/api/index.js", async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.json({ results: [] });
  }

  const playlists = await searchYouTubePlaylists(search);

  res.json({
    id: "youtube-playlist-search",
    type: "series",
    results: playlists
  });
});

// Required for manifest.json
app.get("/manifest.json", (req, res) => {
  res.json({
    id: "youtube-playlist-search",
    version: "1.0.0",
    name: "YouTube Playlist Search",
    description: "Search YouTube playlists and watch in Stremio",
    types: ["series"],
    resources: ["catalog", "stream"],
    idPrefixes: ["ytpl_"]
  });
});

export default app;