import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  setupAuth(app);




  // Tag Routes
  app.get("/api/videos", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const { search, platform, favorite, category, folderId } = req.query;
    const folderIdNum = folderId ? Number(folderId) : undefined;
    
    const videos = await storage.getVideos(userId, {
      search: search as string,
      platform: platform as string,
      category: category as string,
      isFavorite: favorite === 'true' ? true : undefined,
      folderId: (folderIdNum !== undefined && !isNaN(folderIdNum)) ? folderIdNum : undefined
    });
    res.json(videos);
  });

  // Folder Routes
  app.get("/api/folders", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const folders = await storage.getFolders(userId);
    res.json(folders);
  });

  app.post("/api/folders", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const folder = await storage.createFolder(userId, req.body);
    res.status(201).json(folder);
  });

  app.patch("/api/folders/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const folder = await storage.updateFolder(id, userId, req.body);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json(folder);
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteFolder(id, userId);
    res.status(204).send();
  });

  // Tag Routes
  app.get("/api/tags", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const tags = await storage.getTags(userId);
    res.json(tags);
  });

  app.post("/api/tags", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const tag = await storage.createTag(userId, req.body);
    res.status(201).json(tag);
  });

  app.patch("/api/tags/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const tag = await storage.updateTag(id, userId, req.body);
    if (!tag) return res.status(404).json({ message: "Tag not found" });
    res.json(tag);
  });

  app.delete("/api/tags/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteTag(id, userId);
    res.status(204).send();
  });

  app.post("/api/folders/:folderId/tags/:tagId", isAuthenticated, async (req, res) => {
    const folderId = Number(req.params.folderId);
    const tagId = Number(req.params.tagId);
    if (isNaN(folderId) || isNaN(tagId)) return res.status(400).json({ message: "Invalid ID" });
    await storage.addTagToFolder(folderId, tagId);
    res.status(204).send();
  });

  app.delete("/api/folders/:folderId/tags/:tagId", isAuthenticated, async (req, res) => {
    const folderId = Number(req.params.folderId);
    const tagId = Number(req.params.tagId);
    if (isNaN(folderId) || isNaN(tagId)) return res.status(400).json({ message: "Invalid ID" });
    await storage.removeTagFromFolder(folderId, tagId);
    res.status(204).send();
  });

  app.get(api.videos.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const video = await storage.getVideo(id);
    if (!video || video.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  });

  app.post(api.videos.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      // @ts-ignore
      const userId = req.user!.id;
      input.url = await resolveTikTokUrl(input.url);
      if (input.folderId && isNaN(input.folderId)) input.folderId = null;
      const video = await storage.createVideo(userId, input);
      res.status(201).json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.videos.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.videos.update.input.parse(req.body);
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      // @ts-ignore
      const userId = req.user!.id;
      if (input.folderId && isNaN(input.folderId)) input.folderId = null;
      const video = await storage.updateVideo(id, userId, input);
      if (!video) return res.status(404).json({ message: 'Video not found' });
      res.json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.videos.delete.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteVideo(id, userId);
    res.status(204).send();
  });
  
  app.post(api.videos.metadata.path, isAuthenticated, async (req, res) => {
    console.log("\n=== METADATA API CALLED ===");
    console.log("Request body:", req.body);
    
    try {
      const { url } = api.videos.metadata.input.parse(req.body);
      console.log("Parsed URL:", url);
      
      let platform = "other";
      const urlStr = url.toLowerCase();
      if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
      else if (urlStr.includes("tiktok.com")) platform = "tiktok";
      else if (urlStr.includes("instagram.com")) platform = "instagram";
      else if (urlStr.includes("vimeo.com")) platform = "vimeo";
      
      console.log("Detected platform:", platform);

      const resolvedUrl = await resolveTikTokUrl(url);
      console.log("Resolved URL:", resolvedUrl);
      
      let metadata = { title: "Video", thumbnail: "", authorName: "", platform };
      
      try {
        let oembedUrl = "";
        if (platform === "youtube") oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(resolvedUrl)}&format=json`;
        else if (platform === "tiktok") oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
        else if (platform === "vimeo") oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;

        if (oembedUrl) {
          console.log("Fetching metadata from:", oembedUrl);
          const response = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (response.ok) {
            const data = await response.json() as any;
            console.log("Metadata received:", { title: data.title, has_thumb: !!data.thumbnail_url });
            metadata.title = data.title || metadata.title;
            metadata.thumbnail = data.thumbnail_url || "";
            metadata.authorName = data.author_name || "";
          } else {
            console.log("oEmbed request failed with status:", response.status);
          }
        }

        // ALWAYS try YouTube direct thumbnail fallback for better quality
        if (platform === "youtube") {
          const ytMatch = resolvedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          if (videoId) {
            metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            console.log("YouTube thumbnail URL:", metadata.thumbnail);
          }
        }

        // Clean up title: remove notification counters like "(19)" and platform suffixes
        if (metadata.title) {
          // Remove leading notification counter: (19), (2), etc.
          metadata.title = metadata.title.replace(/^\(\d+\)\s*/, '');
          // Remove trailing " - YouTube", " - TikTok", etc.
          metadata.title = metadata.title.replace(/\s*-\s*(YouTube|TikTok|Vimeo|Instagram)\s*$/i, '');
          metadata.title = metadata.title.trim();
          console.log("Cleaned title:", metadata.title);
        }
      } catch (e) {
        console.error("Metadata extraction error:", e);
      }
      
      console.log("=== FINAL METADATA TO SEND ===");
      console.log(JSON.stringify(metadata, null, 2));
      res.json(metadata);
    } catch (err) {
      console.error("=== METADATA API ERROR ===", err);
      res.status(400).json({ message: "Invalid URL" });
    }
  });
  app.get("/api/videos/bookmarklet-code", isAuthenticated, (req, res) => {
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol;
    const appUrl = `${protocol}://${host}`;
    
    // New simple approach: redirect to /quick-add with video data
    // This avoids ALL CORS and Private Network Access issues
    const code = `javascript:(function(){location.href='${appUrl}/quick-add?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)+'&source=bookmarklet';})();`.replace(/\n\s*/g, '');
    
    res.json({ code });
  });


  return httpServer;
}
export async function resolveTikTokUrl(url: string): Promise<string> {
  if (url.includes("vm.tiktok.com") || 
      url.includes("vt.tiktok.com") || 
      url.includes("tiktok.com/t/")) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
      });
      clearTimeout(id);
      if (response.url && response.url !== url) return response.url;
    } catch (e) {
      console.error("Error resolving TikTok short URL:", e);
    }
  }
  return url;
}
