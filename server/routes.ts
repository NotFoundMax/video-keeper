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
  // Setup Auth FIRST
  setupAuth(app);

  // Video Routes - Protected by isAuthenticated
  app.get(api.videos.list.path, isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const { search, platform, favorite, category } = req.query;
    
    const videos = await storage.getVideos(userId, {
      search: search as string,
      platform: platform as string,
      category: category as string,
      isFavorite: favorite === 'true' ? true : undefined
    });
    res.json(videos);
  });

  app.get(api.videos.get.path, isAuthenticated, async (req, res) => {
    const video = await storage.getVideo(Number(req.params.id));
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    // Check ownership
    // @ts-ignore
    if (video.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  });

  app.post(api.videos.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      // @ts-ignore
      const userId = req.user!.id;

      // Handle TikTok short URLs (resolve redirection to get video ID)
      if (input.url.includes("vm.tiktok.com") || 
          input.url.includes("vt.tiktok.com") || 
          input.url.includes("tiktok.com/t/")) {
        try {
           const controller = new AbortController();
           const id = setTimeout(() => controller.abort(), 8000);
           const response = await fetch(input.url, { 
             method: 'GET', 
             redirect: 'follow',
             signal: controller.signal,
             headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
             }
           });
           clearTimeout(id);
           
           if (response.url && response.url !== input.url) {
             console.log("Resolved TikTok URL:", input.url, "->", response.url);
             input.url = response.url;
             input.platform = 'tiktok';
           }
        } catch (e) {
          console.error("Error resolving TikTok short URL:", e);
        }
      }

      const video = await storage.createVideo(userId, input);
      res.status(201).json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.videos.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.videos.update.input.parse(req.body);
      console.log("Updating video:", req.params.id, "Preview input:", req.body, "Parsed:", input);
       // @ts-ignore
      const userId = req.user!.id;
      const video = await storage.updateVideo(Number(req.params.id), userId, input);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      res.json(video);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.videos.delete.path, isAuthenticated, async (req, res) => {
     // @ts-ignore
    const userId = req.user!.id;
    await storage.deleteVideo(Number(req.params.id), userId);
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

      let metadata = {
        title: "Video",
        thumbnail: "",
        authorName: "",
        platform
      };

      try {
        let oembedUrl = "";
        if (platform === "youtube") {
          oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        } else if (platform === "tiktok") {
          oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        } else if (platform === "vimeo") {
          oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        }

        if (oembedUrl) {
          const response = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          if (response.ok) {
            const data = await response.json() as any;
            metadata.title = data.title || metadata.title;
            metadata.thumbnail = data.thumbnail_url || "";
            metadata.authorName = data.author_name || "";
          }
        }
      } catch (e) {
        console.error("Metadata fetch error:", e);
      }

      res.json(metadata);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid URL" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Quick Add Route for Bookmarklet
  app.get("/api/videos/quick-add", isAuthenticated, async (req, res) => {
    const { url, title } = req.query;
    if (!url) return res.status(400).send("URL is required");

    // Basic platform detection
    let platform = "other";
    const urlStr = String(url).toLowerCase();
    if (urlStr.includes("youtube.com") || urlStr.includes("youtu.be")) platform = "youtube";
    else if (urlStr.includes("tiktok.com")) platform = "tiktok";
    else if (urlStr.includes("instagram.com")) platform = "instagram";

    try {
      // @ts-ignore
      const userId = req.user!.id;
      await storage.createVideo(userId, {
        url: String(url),
        title: title ? String(title) : "Quick Added Video",
        platform,
        isFavorite: false,
      });

      res.send(`
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white;">
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
            <h2>¡Agregado a VidStack!</h2>
            <p>Ya puedes cerrar esta ventana.</p>
            <script>setTimeout(() => window.close(), 2000);</script>
          </div>
        </body>
      `);
    } catch (err) {
      res.status(500).send("Error adding video");
    }
  });

  // Dashboard route to show bookmarklet instructions
  app.get("/api/videos/bookmarklet-code", isAuthenticated, (req, res) => {
    const appUrl = `${req.protocol}://${req.get('host')}`;
    const code = `javascript:(function(){const appUrl='${appUrl}';const videoUrl=encodeURIComponent(window.location.href);const videoTitle=encodeURIComponent(document.title);const finalUrl=appUrl+'/api/videos/quick-add?url='+videoUrl+'&title='+videoTitle;window.open(finalUrl,'_blank','width=450,height=350,location=no,menubar=no,status=no,toolbar=no');})();`;
    res.json({ code });
  });

  return httpServer;
}
