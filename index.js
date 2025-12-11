import express from "express";
import fetch from "node-fetch";

const app = express();
const YT_API_KEY = process.env.YT_API_KEY; // Set this in Vercel Environment Variables

async function searchYouTubePlaylists(query) {
    if (!YT_API_KEY) return [];
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=15&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;
    const data = await fetch(url).then(r => r.json());
    if (!data.items) return [];

    return data.items.map(p => ({
        id: "ytpl_" + p.id.playlistId,
        name: p.snippet.title,
        type: "series",
        poster: p.snippet.thumbnails?.high?.url
    }));
}

app.get("/catalog/:type/:id/search=:query", async (req, res) => {
    const { query } = req.params;
    const results = await searchYouTubePlaylists(query);
    res.json({ metas: results });
});

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