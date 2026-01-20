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
    const { search, favorite, folderId, tagIds } = req.query;
    const folderIdNum = folderId ? Number(folderId) : undefined;
    
    // Support either multiple tagIds parameters or a comma-separated string
    let tagIdArray: number[] = [];
    if (tagIds) {
      if (Array.isArray(tagIds)) {
        tagIdArray = tagIds.map(Number);
      } else if (typeof tagIds === 'string') {
        tagIdArray = tagIds.split(',').map(Number);
      }
    }
    
    const videos = await storage.getVideos(userId, {
      search: search as string,
      isFavorite: favorite === 'true' ? true : undefined,
      folderId: (folderIdNum !== undefined && !isNaN(folderIdNum)) ? folderIdNum : undefined,
      tagIds: tagIdArray.length > 0 ? tagIdArray : undefined
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

  // Video Tag Routes
  app.post("/api/videos/:videoId/tags/:tagId", isAuthenticated, async (req, res) => {
    const videoId = Number(req.params.videoId);
    const tagId = Number(req.params.tagId);
    if (isNaN(videoId) || isNaN(tagId)) return res.status(400).json({ message: "Invalid ID" });
    await storage.addTagToVideo(videoId, tagId);
    res.status(204).send();
  });

  app.delete("/api/videos/:videoId/tags/:tagId", isAuthenticated, async (req, res) => {
    const videoId = Number(req.params.videoId);
    const tagId = Number(req.params.tagId);
    if (isNaN(videoId) || isNaN(tagId)) return res.status(400).json({ message: "Invalid ID" });
    await storage.removeTagFromVideo(videoId, tagId);
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
      else if (urlStr.includes("pinterest.com") || urlStr.includes("pin.it")) platform = "pinterest";
      else if (urlStr.includes("twitch.tv")) platform = "twitch";

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
        else if (platform === "pinterest") oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
        else if (platform === "twitch") oembedUrl = `https://www.twitch.tv/oembed?url=${encodeURIComponent(resolvedUrl)}`;

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
              metadata.duration = Math.floor(parseInt(data.duration));
            }
            // Vimeo returns duration differently
            if (platform === "vimeo" && data.video_duration) {
              metadata.duration = Math.floor(data.video_duration);
            }
            // YouTube sometimes uses duration in seconds (integer)
            if (platform === "youtube" && typeof data.duration === 'number') {
              metadata.duration = data.duration;
            }
          }
        }

        // Fallback for Facebook, Instagram, Twitch or if oEmbed failed
        if (!metadata.thumbnail && (platform === "facebook" || platform === "instagram" || platform === "twitch" || platform === "other")) {
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
            
            // 1. Extract og:image
            const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                                html.match(/["']thumbnail_url["']:\s*["']([^"']+)["']/i); // Instagram JSON fallback
            if (ogImageMatch) {
              metadata.thumbnail = ogImageMatch[1].replace(/&amp;/g, '&').replace(/\\u0026/g, '&');
            }
            
            // 2. Fallback to twitter:image
            if (!metadata.thumbnail) {
              const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
              if (twitterImageMatch) {
                metadata.thumbnail = twitterImageMatch[1].replace(/&amp;/g, '&');
              }
            }

            // 3. Fallback to oEmbed discovery
            if (!metadata.thumbnail) {
              const oembedDiscoveryMatch = html.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i);
              if (oembedDiscoveryMatch) {
                try {
                  const oembedRes = await fetch(oembedDiscoveryMatch[1].replace(/&amp;/g, '&'));
                  if (oembedRes.ok) {
                    const oembedData = await oembedRes.json() as any;
                    metadata.thumbnail = oembedData.thumbnail_url || "";
                    metadata.title = oembedData.title || metadata.title;
                  }
                } catch (e) {}
              }
            }

            // 4. Fallback to JSON-LD
            if (!metadata.thumbnail) {
              const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
              if (jsonLdMatch) {
                for (const scriptTag of jsonLdMatch) {
                  try {
                    const contentJson = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
                    const data = JSON.parse(contentJson);
                    const items = Array.isArray(data) ? data : [data];
                    for (const item of items) {
                      const videoObj = item['@type'] === 'VideoObject' ? item : (item['@graph']?.find((g: any) => g['@type'] === 'VideoObject'));
                      if (videoObj) {
                        if (videoObj.thumbnailUrl) {
                          metadata.thumbnail = Array.isArray(videoObj.thumbnailUrl) ? videoObj.thumbnailUrl[0] : videoObj.thumbnailUrl;
                        }
                        if (videoObj.name) metadata.title = videoObj.name;
                        
                        // Extract duration from ISO 8601 (PT1M30S) if provided
                        if (videoObj.duration) {
                          const durationStr = videoObj.duration;
                          const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                          if (match) {
                            const hours = parseInt(match[1] || "0");
                            const mins = parseInt(match[2] || "0");
                            const secs = parseInt(match[3] || "0");
                            metadata.duration = (hours * 3600) + (mins * 60) + secs;
                          } else if (!isNaN(parseInt(durationStr))) {
                            metadata.duration = parseInt(durationStr);
                          }
                        }
                        break;
                      }
                    }
                  } catch (e) {}
                  if (metadata.thumbnail) break;
                }
              }
            }

            // 5. Fallback to <video poster="...">
            if (!metadata.thumbnail) {
              const posterMatch = html.match(/<video[^>]+poster=["']([^"']+)["']/i);
              if (posterMatch) {
                metadata.thumbnail = posterMatch[1];
              }
            }
            
            // Extract title if not already set by oEmbed/JSON-LD
            if (metadata.title === "Video") {
              const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || 
                                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
                                  html.match(/<title>([^<]+)<\/title>/i);
              if (ogTitleMatch) {
                metadata.title = ogTitleMatch[1].replace(/&amp;/g, '&').trim();
              }
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
          metadata.title = metadata.title.replace(/\s*-\s*(YouTube|TikTok|Vimeo|Instagram|Facebook|Twitch)\s*$/i, '');
          metadata.title = metadata.title.trim();
        }

        // Fix Twitch thumbnail placeholders
        if (platform === "twitch" && metadata.thumbnail) {
          metadata.thumbnail = metadata.thumbnail
            .replace('{width}', '640')
            .replace('{height}', '360');
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

  // Playlist Routes
  app.get("/api/playlists", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const playlists = await storage.getPlaylists(userId);
    res.json(playlists);
  });

  app.get("/api/playlists/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    const playlist = await storage.getPlaylist(id, userId);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }
    res.json(playlist);
  });

  app.post("/api/playlists", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const playlist = await storage.createPlaylist(userId, req.body);
    res.status(201).json(playlist);
  });

  app.patch("/api/playlists/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    const playlist = await storage.updatePlaylist(id, userId, req.body);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }
    res.json(playlist);
  });

  app.delete("/api/playlists/:id", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user!.id;
    const id = parseInt(req.params.id);
    await storage.deletePlaylist(id, userId);
    res.status(204).send();
  });

  // Playlist Tags
  app.post("/api/playlists/:playlistId/tags/:tagId", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    const tagId = parseInt(req.params.tagId);
    await storage.addTagToPlaylist(playlistId, tagId);
    res.status(201).send();
  });

  app.delete("/api/playlists/:playlistId/tags/:tagId", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    const tagId = parseInt(req.params.tagId);
    await storage.removeTagFromPlaylist(playlistId, tagId);
    res.status(204).send();
  });

  // Playlist Videos
  app.post("/api/playlists/:playlistId/videos/:videoId", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    const videoId = parseInt(req.params.videoId);
    const { position } = req.body;
    await storage.addVideoToPlaylist(playlistId, videoId, position || 0);
    res.status(201).send();
  });

  app.delete("/api/playlists/:playlistId/videos/:videoId", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    const videoId = parseInt(req.params.videoId);
    await storage.removeVideoFromPlaylist(playlistId, videoId);
    res.status(204).send();
  });

  app.post("/api/playlists/:playlistId/reorder", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    const { videoIds } = req.body;
    await storage.reorderPlaylistVideos(playlistId, videoIds);
    res.status(200).send();
  });

  app.post("/api/playlists/:playlistId/sync", isAuthenticated, async (req, res) => {
    const playlistId = parseInt(req.params.playlistId);
    await storage.syncPlaylistVideos(playlistId);
    res.status(200).send();
  });


  return httpServer;
}
export async function resolveUrlRedirects(url: string): Promise<string> {
  if (url.includes("vm.tiktok.com") || 
      url.includes("vt.tiktok.com") || 
      url.includes("tiktok.com/t/") ||
      url.includes("facebook.com/share/") ||
      url.includes("fb.watch/") ||
      url.includes("clips.twitch.tv") ||
      url.includes("pin.it")) {
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
