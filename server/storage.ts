import { db } from "./db";
import {
  videos,
  type CreateVideoRequest,
  type UpdateVideoRequest,
  type Video
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getVideos(userId: string): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(userId: string, video: CreateVideoRequest): Promise<Video>;
  updateVideo(id: number, userId: string, updates: UpdateVideoRequest): Promise<Video | undefined>;
  deleteVideo(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getVideos(userId: string): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(userId: string, video: CreateVideoRequest): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values({ ...video, userId })
      .returning();
    return newVideo;
  }

  async updateVideo(id: number, userId: string, updates: UpdateVideoRequest): Promise<Video | undefined> {
    const [updated] = await db
      .update(videos)
      .set(updates)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return updated;
  }

  async deleteVideo(id: number, userId: string): Promise<void> {
    await db
      .delete(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
