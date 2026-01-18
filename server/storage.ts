import { db } from "./db";
import {
  videos,
  type CreateVideoRequest,
  type UpdateVideoRequest,
  type Video
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getVideos(userId: number): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(userId: number, video: CreateVideoRequest): Promise<Video>;
  updateVideo(id: number, userId: number, updates: UpdateVideoRequest): Promise<Video | undefined>;
  deleteVideo(id: number, userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVideos(userId: number, filters?: { search?: string; platform?: string; isFavorite?: boolean; category?: string }): Promise<Video[]> {
    let query = db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId));

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

    if (filters?.search) {
      // Simple case-insensitive search on title
      const ilikeSearch = `%${filters.search}%`;
      // We'll use sql template tag for ILIKE as drizzle-orm might need it depending on the driver
      // For node-postgres, we can use ilike helper if imported
      const { ilike } = await import("drizzle-orm");
      clauses.push(ilike(videos.title, ilikeSearch));
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
}

export const storage = new DatabaseStorage();
