import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // 'youtube', 'tiktok', 'instagram', 'other'
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").default("general"),
  isFavorite: boolean("is_favorite").default(false),
  lastTimestamp: integer("last_timestamp").default(0), // Saved progress in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({ 
  id: true, 
  userId: true, 
  createdAt: true 
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type CreateVideoRequest = InsertVideo;
export type UpdateVideoRequest = Partial<InsertVideo>;
