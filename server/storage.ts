import { db } from "./db";
import {
  videos,
  folders,
  tags,
  folderTags,
  type CreateVideoRequest,
  type UpdateVideoRequest,
  type Video,
  type Folder,
  type InsertFolder,
  type Tag,
  type InsertTag
} from "@shared/schema";
import { eq, and, desc, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // Videos
  getVideos(userId: number, filters?: { search?: string; platform?: string; isFavorite?: boolean; category?: string; folderId?: number }): Promise<Video[]>;
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
}

export class DatabaseStorage implements IStorage {
  async getVideos(userId: number, filters?: { search?: string; platform?: string; isFavorite?: boolean; category?: string; folderId?: number }): Promise<Video[]> {
    const clauses = [eq(videos.userId, userId)];
    
    if (filters?.platform && filters.platform !== "all") {
      clauses.push(eq(videos.platform, filters.platform));
    }

    if (filters?.category && filters.category !== "all") {
      clauses.push(eq(videos.category, filters.category));
    }
    
    if (filters?.isFavorite !== undefined) {
      clauses.push(eq(videos.isFavorite, filters.isFavorite));
    }

    if (filters?.folderId !== undefined && !isNaN(filters.folderId)) {
      clauses.push(eq(videos.folderId, filters.folderId));
    }

    if (filters?.search) {
      clauses.push(ilike(videos.title, `%${filters.search}%`));
    }

    return await db
      .select()
      .from(videos)
      .where(and(...clauses))
      .orderBy(desc(videos.createdAt));
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
}

export const storage = new DatabaseStorage();
