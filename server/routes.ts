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

  // 2. Priority Bookmarklet Route
  app.get("/bookmarklet/add", async (req, res) => {
    try {
      const url = req.query.url as string;
      const title = req.query.title as string;
      
      console.log(">>> BOOKMARKLET INCOMING:", { url: url?.slice(0, 50), auth: req.isAuthenticated() });

      if (!url) return res.status(400).send("URL is required");

      if (!req.isAuthenticated()) {
        return res.send(`
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; padding: 20px;">
            <div>
              <div style="font-size: 40px; margin-bottom: 20px;">🔒</div>
              <h2 style="margin-bottom: 10px;">Inicia Sesión</h2>
              <p style="color: #94a3b8; margin-bottom: 25px;">Debes estar conectado a Videoteca para guardar videos.</p>
              <a href="/auth" target="_blank" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 12px;">Iniciar Sesión</a>
              <p style="font-size: 12px; color: #64748b; margin-top: 25px;">Una vez iniciada la sesión, vuelve a pulsar el marcador.</p>
            </div>
          </body>
        `);
      }

      let platform = "other";
      const urlStr = url.toLowerCase();
      if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
      else if (urlStr.includes("tiktok.com")) platform = "tiktok";
      else if (urlStr.includes("instagram.com")) platform = "instagram";

      // @ts-ignore
      const userId = Number(req.user!.id);
      const resolvedUrl = await resolveTikTokUrl(url);

      // Try to fetch metadata for a better experience
      let metadata = { title: title || "Video Guardado", thumbnail: "" };
      
      try {
        const urlStrResolved = resolvedUrl.toLowerCase();
        let oembedUrl = "";
        if (urlStrResolved.includes("youtube.com") || urlStrResolved.includes("youtu.be")) {
          oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(resolvedUrl)}&format=json`;
        } else if (urlStrResolved.includes("tiktok.com")) {
          oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
        } else if (urlStrResolved.includes("vimeo.com")) {
          oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
        }

        if (oembedUrl) {
          console.log("Fetching oEmbed:", oembedUrl);
          const response = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (response.ok) {
            const data = await response.json() as any;
            metadata.title = data.title || metadata.title;
            metadata.thumbnail = data.thumbnail_url || "";
            console.log("oEmbed Success:", { title: metadata.title, thumb: !!metadata.thumbnail });
          } else {
            console.log("oEmbed Failed with status:", response.status);
          }
        }
        
        // Fallback for YouTube thumbnails if oEmbed fails or doesn't return one
        if (platform === "youtube" && !metadata.thumbnail) {
          const ytMatch = resolvedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          if (videoId) {
            metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            console.log("YouTube Fallback Thumbnail:", metadata.thumbnail);
          }
        }
      } catch (e) {
        console.log("Metadata fetch failed for bookmarklet:", e);
      }

      console.log("Metadata to save:", metadata);
      console.log("Saving video for user:", userId, "URL:", resolvedUrl);
      
      await storage.createVideo(userId, {
        url: resolvedUrl,
        title: metadata.title,
        thumbnailUrl: metadata.thumbnail || null,
        platform,
        isFavorite: false,
        folderId: null,
      });

      return res.send(`
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; padding: 20px;">
          <div style="max-width: 300px;">
            <div style="font-size: 50px; margin-bottom: 20px; animation: scaleIn 0.5s ease-out;">✅</div>
            <h2 style="color: #4ade80; margin-bottom: 10px; font-size: 24px;">¡Guardado!</h2>
            <p style="color: #94a3b8; line-height: 1.5;">"${metadata.title.slice(0, 50)}${metadata.title.length > 50 ? '...' : ''}" se ha añadido a tu colección.</p>
            <style>
              @keyframes scaleIn {
                0% { transform: scale(0); }
                80% { transform: scale(1.2); }
                100% { transform: scale(1); }
              }
            </style>
            <script>
              setTimeout(() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }, 2500);
            </script>
          </div>
        </body>
      `);
    } catch (err) {
      console.error("Bookmarklet Error:", err);
      return res.send(`
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; padding: 20px;">
          <div>
            <div style="font-size: 40px; margin-bottom: 20px;">❌</div>
            <h2 style="color: #f87171; margin-bottom: 10px;">Error al guardar</h2>
            <p style="color: #94a3b8;">No pudimos guardar el video. ${err instanceof Error ? err.message : ""}</p>
            <button onclick="window.close()" style="margin-top: 20px; background: #334155; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer;">Cerrar</button>
          </div>
        </body>
      `);
    }
  });

  // Video Routes
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
    try {
      const { url } = api.videos.metadata.input.parse(req.body);
      let platform = "other";
      const urlStr = url.toLowerCase();
      if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
      else if (urlStr.includes("tiktok.com")) platform = "tiktok";
      else if (urlStr.includes("instagram.com")) platform = "instagram";
      else if (urlStr.includes("vimeo.com")) platform = "vimeo";

      const resolvedUrl = await resolveTikTokUrl(url);
      let metadata = { title: "Video", thumbnail: "", authorName: "", platform };
      
      try {
        let oembedUrl = "";
        if (platform === "youtube") oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(resolvedUrl)}&format=json`;
        else if (platform === "tiktok") oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
        else if (platform === "vimeo") oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;

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
          }
        }

        // Fallback for YouTube thumbnails
        if (platform === "youtube" && !metadata.thumbnail) {
          const ytMatch = resolvedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          if (videoId) {
            metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      } catch (e) {
        console.error("Metadata extraction error:", e);
      }
      res.json(metadata);
    } catch (err) {
      res.status(400).json({ message: "Invalid URL" });
    }
  });

  app.get("/api/videos/bookmarklet-code", isAuthenticated, (req, res) => {
    let host = req.get('host') || 'localhost:5000';
    // Force localhost if accessing via 127.0.0.1 for better browser compatibility
    if (host.startsWith('127.0.0.1')) host = host.replace('127.0.0.1', 'localhost');
    
    const appUrl = `${req.protocol}://${host}`;
    const code = `javascript:(function(){const u=window.location.href;const t=document.title;const url='${appUrl}/bookmarklet/add?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(t);const w=window.open(url,'_blank','width=450,height=550');if(!w)location.href=url;})();`;
    res.json({ code });
  });

  return httpServer;
}

async function resolveTikTokUrl(url: string): Promise<string> {
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
      
      if (response.url && response.url !== url) {
        return response.url;
      }
    } catch (e) {
      console.error("Error resolving TikTok short URL:", e);
    }
  }
  return url;
}
