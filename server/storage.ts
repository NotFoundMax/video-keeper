import { db } from "./db";
import {
  videos,
  folders,
  tags,
  folderTags,
  videoTags,
  playlists,
  playlistTags,
  playlistVideos,
  type CreateVideoRequest,
  type UpdateVideoRequest,
  type Video,
  type Folder,
  type InsertFolder,
  type Tag,
  type InsertTag,
  type Playlist,
  type CreatePlaylistRequest,
  type UpdatePlaylistRequest
} from "@shared/schema";
import { eq, and, desc, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // Videos
  getVideos(userId: number, filters?: { search?: string; isFavorite?: boolean; folderId?: number; tagIds?: number[] }): Promise<(Video & { tags: Tag[] })[]>;
  getVideo(id: number): Promise<Video | undefined>;
  findByUrl(userId: number, url: string): Promise<Video | undefined>;
  createVideo(userId: number, video: CreateVideoRequest): Promise<Video>;
  updateVideo(id: number, userId: number, updates: UpdateVideoRequest): Promise<Video | undefined>;
  deleteVideo(id: number, userId: number): Promise<void>;

  // Folders
  getFolders(userId: number): Promise<(Folder & { tags: Tag[] })[]>;
  getFolder(id: number, userId: number): Promise<Folder | undefined>;
  createFolder(userId: number, folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, userId: number, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number, userId: number): Promise<void>;

  // Tags
  getTags(userId: number): Promise<Tag[]>;
  createTag(userId: number, tag: InsertTag): Promise<Tag>;
  updateTag(id: number, userId: number, updates: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number, userId: number): Promise<void>;

  // Folder Tags
  addTagToFolder(folderId: number, tagId: number): Promise<void>;
  removeTagFromFolder(folderId: number, tagId: number): Promise<void>;

  // Video Tags
  addTagToVideo(videoId: number, tagId: number): Promise<void>;
  removeTagFromVideo(videoId: number, tagId: number): Promise<void>;

  // Playlists
  getPlaylists(userId: number): Promise<(Playlist & { tags: Tag[]; videoCount: number; totalDuration: number })[]>;
  getPlaylist(id: number, userId: number): Promise<(Playlist & { tags: Tag[]; videos: (Video & { position: number })[] }) | undefined>;
  createPlaylist(userId: number, playlist: CreatePlaylistRequest): Promise<Playlist>;
  updatePlaylist(id: number, userId: number, updates: UpdatePlaylistRequest): Promise<Playlist | undefined>;
  deletePlaylist(id: number, userId: number): Promise<void>;
  
  // Playlist Tags
  addTagToPlaylist(playlistId: number, tagId: number): Promise<void>;
  removeTagFromPlaylist(playlistId: number, tagId: number): Promise<void>;
  
  // Playlist Videos
  addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<void>;
  removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void>;
  reorderPlaylistVideos(playlistId: number, videoIds: number[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVideos(userId: number, filters?: { search?: string; isFavorite?: boolean; folderId?: number; tagIds?: number[] }): Promise<(Video & { tags: Tag[] })[]> {
    const clauses = [eq(videos.userId, userId)];
    
    if (filters?.isFavorite !== undefined) {
      clauses.push(eq(videos.isFavorite, filters.isFavorite));
    }

    if (filters?.folderId !== undefined && !isNaN(filters.folderId)) {
      clauses.push(eq(videos.folderId, filters.folderId));
    }

    if (filters?.tagIds && filters.tagIds.length > 0) {
      // Intersection logic: Video must have ALL selected tags
      for (const tagId of filters.tagIds) {
        if (!isNaN(tagId)) {
          const videosWithTag = db.select({ id: videoTags.videoId })
                                  .from(videoTags)
                                  .where(eq(videoTags.tagId, tagId));
          clauses.push(inArray(videos.id, videosWithTag));
        }
      }
    }

    if (filters?.search) {
      clauses.push(ilike(videos.title, `%${filters.search}%`));
    }

    const allVideos = await db
      .select()
      .from(videos)
      .where(and(...clauses))
      .orderBy(desc(videos.createdAt));

    // Efficiently fetch tags for all videos
    const videosWithTags = await Promise.all(allVideos.map(async (video) => {
      const tagsForVideo = await db
        .select({
          id: tags.id,
          userId: tags.userId,
          name: tags.name,
          color: tags.color
        })
        .from(videoTags)
        .innerJoin(tags, eq(videoTags.tagId, tags.id))
        .where(eq(videoTags.videoId, video.id));
      
      return { ...video, tags: tagsForVideo };
    }));

    return videosWithTags;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async findByUrl(userId: number, url: string): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.url, url)))
      .limit(1);
    return video;
  }

  async createVideo(userId: number, video: CreateVideoRequest): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values({ ...video, userId })
      .returning();
    return newVideo;
  }

  async updateVideo(id: number, userId: number, updates: UpdateVideoRequest): Promise<Video | undefined> {
    const [updated] = await db
      .update(videos)
      .set(updates)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return updated;
  }

  async deleteVideo(id: number, userId: number): Promise<void> {
    await db
      .delete(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)));
  }

  // Folders
  async getFolders(userId: number): Promise<(Folder & { tags: Tag[]; videoCount: number })[]> {
    const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
    
    const foldersWithTags = await Promise.all(allFolders.map(async (folder) => {
      const tagsForFolder = await db
        .select({
          id: tags.id,
          userId: tags.userId,
          name: tags.name,
          color: tags.color
        })
        .from(folderTags)
        .innerJoin(tags, eq(folderTags.tagId, tags.id))
        .where(eq(folderTags.folderId, folder.id));
      
      const [videoCountResult] = await db
        .select({ count: db.$count(videos, eq(videos.folderId, folder.id)) })
        .from(videos)
        .limit(1);

      const [latestVideo] = await db
        .select({ thumbnailUrl: videos.thumbnailUrl })
        .from(videos)
        .where(eq(videos.folderId, folder.id))
        .orderBy(desc(videos.createdAt))
        .limit(1);

      return { 
        ...folder, 
        tags: tagsForFolder, 
        videoCount: videoCountResult?.count || 0,
        coverUrl: latestVideo?.thumbnailUrl || null
      };
    }));

    return foldersWithTags;
  }

  async getFolder(id: number, userId: number): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return folder;
  }

  async createFolder(userId: number, folder: InsertFolder): Promise<Folder> {
    const [newFolder] = await db.insert(folders).values({ ...folder, userId }).returning();
    return newFolder;
  }

  async updateFolder(id: number, userId: number, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [updated] = await db
      .update(folders)
      .set(updates)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return updated;
  }

  async deleteFolder(id: number, userId: number): Promise<void> {
    // First, set folderId to null for all videos in this folder
    await db.update(videos).set({ folderId: null }).where(eq(videos.folderId, id));
    await db.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));
  }

  // Tags
  async getTags(userId: number): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.userId, userId));
  }

  async createTag(userId: number, tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values({ ...tag, userId }).returning();
    return newTag;
  }

  async updateTag(id: number, userId: number, updates: Partial<InsertTag>): Promise<Tag | undefined> {
    const [updated] = await db
      .update(tags)
      .set(updates)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTag(id: number, userId: number): Promise<void> {
    await db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
  }

  // Folder Tags
  async addTagToFolder(folderId: number, tagId: number): Promise<void> {
    await db.insert(folderTags).values({ folderId, tagId }).onConflictDoNothing();
  }

  async removeTagFromFolder(folderId: number, tagId: number): Promise<void> {
    await db.delete(folderTags).where(and(eq(folderTags.folderId, folderId), eq(folderTags.tagId, tagId)));
  }

  // Video Tags
  async addTagToVideo(videoId: number, tagId: number): Promise<void> {
    await db.insert(videoTags).values({ videoId, tagId }).onConflictDoNothing();
    
    // Auto-Add Logic: Check playlists that have this tag and auto_add: true
    const matchingPlaylists = await db
      .select({ id: playlists.id })
      .from(playlistTags)
      .innerJoin(playlists, eq(playlistTags.playlistId, playlists.id))
      .where(and(eq(playlistTags.tagId, tagId), eq(playlists.autoAdd, true)));

    for (const p of matchingPlaylists) {
      // Find current max position to append
      const videosInP = await db
        .select({ position: playlistVideos.position })
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, p.id))
        .orderBy(desc(playlistVideos.position))
        .limit(1);
      
      const nextPos = (videosInP[0]?.position ?? -1) + 1;
      await this.addVideoToPlaylist(p.id, videoId, nextPos);
    }
  }

  async removeTagFromVideo(videoId: number, tagId: number): Promise<void> {
    await db.delete(videoTags).where(and(eq(videoTags.videoId, videoId), eq(videoTags.tagId, tagId)));
  }

  async syncPlaylistVideos(playlistId: number): Promise<void> {
    const tagsForPlaylist = await db
      .select({ tagId: playlistTags.tagId })
      .from(playlistTags)
      .where(eq(playlistTags.playlistId, playlistId));
    
    const tagIds = tagsForPlaylist.map(t => t.tagId);
    if (tagIds.length === 0) return;

    // Find all videos that have any of these tags and are NOT already in the playlist
    const matchingVideos = await db
      .select({ videoId: videoTags.videoId })
      .from(videoTags)
      .where(inArray(videoTags.tagId, tagIds));

    const videoIds = Array.from(new Set(matchingVideos.map(v => v.videoId)));
    
    // Get existing videos in playlist
    const existingInPlaylist = await db
      .select({ videoId: playlistVideos.videoId })
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlistId));
    
    const existingIds = new Set(existingInPlaylist.map(v => v.videoId));
    const newVideoIds = videoIds.filter(id => !existingIds.has(id));

    if (newVideoIds.length === 0) return;

    // Find max position
    const videosInP = await db
        .select({ position: playlistVideos.position })
        .from(playlistVideos)
        .where(eq(playlistVideos.playlistId, playlistId))
        .orderBy(desc(playlistVideos.position))
        .limit(1);
    
    let currentPos = (videosInP[0]?.position ?? -1) + 1;

    for (const vId of newVideoIds) {
      await this.addVideoToPlaylist(playlistId, vId, currentPos++);
    }
  }

  // Playlists
  async getPlaylists(userId: number): Promise<(Playlist & { tags: Tag[]; videoCount: number; totalDuration: number })[]> {
    const allPlaylists = await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));

    const playlistsWithData = await Promise.all(allPlaylists.map(async (playlist) => {
      // Get tags for this playlist
      const tagsForPlaylist = await db
        .select({
          id: tags.id,
          userId: tags.userId,
          name: tags.name,
          color: tags.color
        })
        .from(playlistTags)
        .innerJoin(tags, eq(playlistTags.tagId, tags.id))
        .where(eq(playlistTags.playlistId, playlist.id));

      // Get videos and calculate total duration
      const videosInPlaylist = await db
        .select({
          duration: videos.duration
        })
        .from(playlistVideos)
        .innerJoin(videos, eq(playlistVideos.videoId, videos.id))
        .where(eq(playlistVideos.playlistId, playlist.id));

      const totalDuration = videosInPlaylist.reduce((acc, v) => acc + (v.duration || 0), 0);

      return {
        ...playlist,
        tags: tagsForPlaylist,
        videoCount: videosInPlaylist.length,
        totalDuration
      };
    }));

    return playlistsWithData;
  }

  async getPlaylist(id: number, userId: number): Promise<(Playlist & { tags: Tag[]; videos: (Video & { position: number })[] }) | undefined> {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)));

    if (!playlist) return undefined;

    // Get tags
    const tagsForPlaylist = await db
      .select({
        id: tags.id,
        userId: tags.userId,
        name: tags.name,
        color: tags.color
      })
      .from(playlistTags)
      .innerJoin(tags, eq(playlistTags.tagId, tags.id))
      .where(eq(playlistTags.playlistId, id));

    // Get videos with position
    const videosInPlaylist = await db
      .select({
        video: videos,
        position: playlistVideos.position
      })
      .from(playlistVideos)
      .innerJoin(videos, eq(playlistVideos.videoId, videos.id))
      .where(eq(playlistVideos.playlistId, id))
      .orderBy(playlistVideos.position);

    const videosWithPosition = videosInPlaylist.map(({ video, position }) => ({
      ...video,
      position
    }));

    return {
      ...playlist,
      tags: tagsForPlaylist,
      videos: videosWithPosition
    };
  }

  async createPlaylist(userId: number, playlist: CreatePlaylistRequest): Promise<Playlist> {
    const [newPlaylist] = await db
      .insert(playlists)
      .values({ ...playlist, userId })
      .returning();
    return newPlaylist;
  }

  async updatePlaylist(id: number, userId: number, updates: UpdatePlaylistRequest): Promise<Playlist | undefined> {
    const [updated] = await db
      .update(playlists)
      .set(updates)
      .where(and(eq(playlists.id, id), eq(playlists.userId, userId)))
      .returning();
    return updated;
  }

  async deletePlaylist(id: number, userId: number): Promise<void> {
    await db.delete(playlists).where(and(eq(playlists.id, id), eq(playlists.userId, userId)));
  }

  // Playlist Tags
  async addTagToPlaylist(playlistId: number, tagId: number): Promise<void> {
    await db.insert(playlistTags).values({ playlistId, tagId }).onConflictDoNothing();
  }

  async removeTagFromPlaylist(playlistId: number, tagId: number): Promise<void> {
    await db.delete(playlistTags).where(and(eq(playlistTags.playlistId, playlistId), eq(playlistTags.tagId, tagId)));
  }

  // Playlist Videos
  async addVideoToPlaylist(playlistId: number, videoId: number, position: number): Promise<void> {
    await db.insert(playlistVideos).values({ playlistId, videoId, position }).onConflictDoNothing();
  }

  async removeVideoFromPlaylist(playlistId: number, videoId: number): Promise<void> {
    await db.delete(playlistVideos).where(and(eq(playlistVideos.playlistId, playlistId), eq(playlistVideos.videoId, videoId)));
  }

  async reorderPlaylistVideos(playlistId: number, videoIds: number[]): Promise<void> {
    // Delete all existing videos in playlist
    await db.delete(playlistVideos).where(eq(playlistVideos.playlistId, playlistId));
    
    // Re-insert with new positions
    if (videoIds.length > 0) {
      const values = videoIds.map((videoId, index) => ({
        playlistId,
        videoId,
        position: index
      }));
      await db.insert(playlistVideos).values(values);
    }
  }
}

export const storage = new DatabaseStorage();
