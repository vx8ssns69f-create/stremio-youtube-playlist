import { addonBuilder } from "stremio-addon-sdk";
import fetch from "node-fetch";

const YT_API_KEY = process.env.YT_API_KEY;
const builder = new addonBuilder({
  id: "community.youtube.playlists",
  version: "1.0.0",
  name: "YouTube Playlists Search",
  description: "Search YouTube playlists and watch them as series.",
  catalogs: [
    {
      type: "series",
      id: "ytsearch",
      name: "YouTube Playlists Search",
      extra: [{ name: "search" }]
    }
  ],
  resources: ["catalog", "stream"],
  types: ["series"],
  idPrefixes: ["ytp_"]
});

async function searchYouTubePlaylists(query) {
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=20&q=${encodeURIComponent(query)}&key=${YT_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.items.map(p => ({
    id: `ytp_${p.id.playlistId}`,
    type: "series",
    name: p.snippet.title,
    poster: p.snippet.thumbnails?.high?.url,
    description: p.snippet.description || "",
    background: p.snippet.thumbnails?.medium?.url
  }));
}

async function fetchPlaylistVideos(pid) {
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pid}&key=${YT_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.items.map((v, i) => ({
    id: `ytvid_${v.snippet.resourceId.videoId}`,
    title: v.snippet.title,
    episode: i + 1,
    thumbnail: v.snippet.thumbnails?.high?.url,
    video: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`
  }));
}

builder.defineCatalogHandler(async args => {
  if (args.extra?.search) {
    const results = await searchYouTubePlaylists(args.extra.search);
    return { metas: results };
  }
  return { metas: [] };
});

builder.defineStreamHandler(async args => {
  if (args.id.startsWith("ytp_")) {
    const playlistId = args.id.replace("ytp_", "");
    const videos = await fetchPlaylistVideos(playlistId);

    return {
      streams: videos.map(v => ({
        name: v.title,
        title: v.title,
        url: v.video
      }))
    };
  }

  return { streams: [] };
});

export default builder.getInterface();