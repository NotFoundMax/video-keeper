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
      input.url = await resolveUrlRedirects(input.url);
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

  // Lightweight progress update endpoint (no full validation needed)
  app.patch("/api/videos/:id/progress", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { lastTimestamp } = req.body;
      
      if (isNaN(id) || typeof lastTimestamp !== 'number' || lastTimestamp < 0) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      // @ts-ignore
      const userId = req.user!.id;
      const updated = await storage.updateVideo(id, userId, { lastTimestamp });
      
      if (!updated) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json({ success: true, lastTimestamp });
    } catch (err) {
      console.error("Progress update error:", err);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });
  
  app.post(api.videos.metadata.path, isAuthenticated, async (req, res) => {
    try {
      const { url } = api.videos.metadata.input.parse(req.body);
      
      let platform = "other";
      const urlStr = url.toLowerCase();
      if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
      else if (urlStr.includes("tiktok.com")) platform = "tiktok";
      else if (urlStr.includes("instagram.com")) platform = "instagram";
      else if (urlStr.includes("vimeo.com")) platform = "vimeo";
      else if (urlStr.includes("facebook.com") || urlStr.includes("fb.watch")) platform = "facebook";

      const resolvedUrl = await resolveUrlRedirects(url);
      
      let metadata = { 
        title: "Video", 
        thumbnail: "", 
        authorName: "", 
        duration: 0,
        platform, 
        aspectRatio: "auto" 
      };
      
      // Auto-detect verticality
      if (platform === "tiktok" || platform === "instagram" || url.includes("/shorts/") || url.includes("/reel/") || url.includes("/reels/") || url.includes("fb.watch")) {
        metadata.aspectRatio = "vertical";
      }
      
      try {
        let oembedUrl = "";
        if (platform === "youtube") oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(resolvedUrl)}&format=json`;
        else if (platform === "tiktok") oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
        else if (platform === "vimeo") oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
        else if (platform === "instagram") oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(resolvedUrl)}`;

        if (oembedUrl) {
          const response = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (response.ok) {
            const data = await response.json() as any;
            metadata.title = data.title || metadata.title;
            metadata.thumbnail = data.thumbnail_url || "";
            metadata.authorName = data.author_name || "";
            
            // Extract duration if available
            if (data.duration) {
              metadata.duration = parseInt(data.duration);
            }
            // Vimeo returns duration differently
            if (platform === "vimeo" && data.video_duration) {
              metadata.duration = data.video_duration;
            }
          }
        }

        // Fallback for Facebook, Instagram or if oEmbed failed
        if (!metadata.thumbnail && (platform === "facebook" || platform === "instagram" || platform === "other")) {
          let fetchUrl = resolvedUrl;
          let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
          
          if (platform === "facebook" || platform === "instagram") {
            // Use mobile version as it's often less restrictive for scraping meta tags
            if (platform === "facebook") {
              fetchUrl = resolvedUrl.replace('www.facebook.com', 'm.facebook.com');
              if (!fetchUrl.includes('m.facebook.com')) {
                const urlObj = new URL(resolvedUrl);
                urlObj.hostname = 'm.facebook.com';
                fetchUrl = urlObj.toString();
              }
            }
            // For Instagram, sometimes adding /embed/ helps get metadata without login
            if (platform === "instagram" && !resolvedUrl.includes('/embed/')) {
              const urlObj = new URL(resolvedUrl);
              urlObj.pathname = urlObj.pathname.replace(/\/$/, '') + '/embed/';
              fetchUrl = urlObj.toString();
            }
            userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
          }

          const response = await fetch(fetchUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (response.ok) {
            const html = await response.text();
            
            // Extract og:image
            const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                                html.match(/["']thumbnail_url["']:\s*["']([^"']+)["']/i); // Instagram JSON fallback
            if (ogImageMatch) {
              metadata.thumbnail = ogImageMatch[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
            }
            
            // Extract og:title
            const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || 
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
                                html.match(/<title>([^<]+)<\/title>/i);
            if (ogTitleMatch) {
              metadata.title = ogTitleMatch[1].replace(/&amp;/g, '&').trim();
            }
          }
        }

        // ALWAYS try YouTube direct thumbnail fallback for better quality
        if (platform === "youtube") {
          const ytMatch = resolvedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          if (videoId) {
            metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }

        // Clean up title: remove notification counters and platform suffixes
        if (metadata.title) {
          metadata.title = metadata.title.replace(/^\(\d+\)\s*/, '');
          metadata.title = metadata.title.replace(/\s*-\s*(YouTube|TikTok|Vimeo|Instagram|Facebook)\s*$/i, '');
          metadata.title = metadata.title.trim();
        }
      } catch (e) {
        console.error("Metadata extraction error:", e);
      }
      
      res.json(metadata);
    } catch (err) {
      console.error("Metadata API error:", err);
      res.status(400).json({ message: "Invalid URL" });
    }
  });

  // Check for duplicate videos
  app.post("/api/videos/check-duplicate", isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      // @ts-ignore
      const userId = req.user!.id;
      
      // Resolve any short URLs first
      const resolvedUrl = await resolveUrlRedirects(url);
      
      // Check if this URL already exists
      const existing = await storage.findByUrl(userId, resolvedUrl);
      
      if (existing) {
        return res.json({ exists: true, video: existing });
      }
      
      res.json({ exists: false });
    } catch (err) {
      console.error("Duplicate check error:", err);
      res.status(500).json({ message: "Failed to check duplicate" });
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
export async function resolveUrlRedirects(url: string): Promise<string> {
  if (url.includes("vm.tiktok.com") || 
      url.includes("vt.tiktok.com") || 
      url.includes("tiktok.com/t/") ||
      url.includes("facebook.com/share/") ||
      url.includes("fb.watch/")) {
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
      
      // If it's a Facebook share URL and didn't redirect, try to scrape og:url
      if (url.includes("facebook.com/share/") && response.url === url) {
        const html = await response.text();
        const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i);
        if (ogUrlMatch) {
          return ogUrlMatch[1].replace(/&amp;/g, '&');
        }
      }

      if (response.url && response.url !== url) return response.url;
    } catch (e) {
      console.error("Error resolving short URL:", e);
    }
  }
  return url;
}
