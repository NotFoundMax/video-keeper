import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Video Routes - Protected by isAuthenticated
  app.get(api.videos.list.path, isAuthenticated, async (req, res) => {
    // @ts-ignore - user is added by auth middleware
    const userId = req.user!.claims.sub;
    const videos = await storage.getVideos(userId);
    res.json(videos);
  });

  app.get(api.videos.get.path, isAuthenticated, async (req, res) => {
    const video = await storage.getVideo(Number(req.params.id));
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    // Check ownership
    // @ts-ignore
    if (video.userId !== req.user!.claims.sub) {
        return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  });

  app.post(api.videos.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.videos.create.input.parse(req.body);
      // @ts-ignore
      const userId = req.user!.claims.sub;
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
       // @ts-ignore
      const userId = req.user!.claims.sub;
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
    const userId = req.user!.claims.sub;
    await storage.deleteVideo(Number(req.params.id), userId);
    res.status(204).send();
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
      const userId = req.user!.claims.sub;
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
