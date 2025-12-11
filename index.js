import express from "express";
import fetch from "node-fetch";

const app = express();

// YouTube scraper (no API key needed)
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

    return result.slice(0, 20);
}

// ---- STREMIO CATALOG ENDPOINT ----
// Stremio always calls this format:
// /catalog/series/youtube/search=<query>
app.get("/catalog/:type/:id/search=:query", async (req, res) => {
    const { query } = req.params;

    const results = await searchYouTubePlaylists(query);

    res.json({
        metas: results
    });
});

// Fallback (optional)
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
            {
                type: "series",
                id: "youtube",
                name: "YouTube Playlists"
            }
        ],
        resources: ["catalog"],
        types: ["series"],
        idPrefixes: ["ytpl_"]
    });
});

export default app;