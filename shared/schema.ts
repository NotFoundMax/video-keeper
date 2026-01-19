import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"), // Custom cover image for the folder
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  color: text("color").default("#3b82f6"), // Default blue
});

export const folderTags = pgTable("folder_tags", {
  folderId: integer("folder_id").notNull().references(() => folders.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  {
    pk: [table.folderId, table.tagId],
  }
]);

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => folders.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  platform: text("platform").notNull(), // 'youtube', 'tiktok', 'instagram', 'other'
  thumbnailUrl: text("thumbnail_url"),
  authorName: text("author_name"), // Channel or author name
  duration: integer("duration"), // Video duration in seconds
  category: text("category").default("general"),
  isFavorite: boolean("is_favorite").default(false),
  aspectRatio: text("aspect_ratio").default("auto"), // 'auto', 'horizontal', 'vertical', 'square'
  lastTimestamp: integer("last_timestamp").default(0), // Saved progress in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoTags = pgTable("video_tags", {
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  {
    pk: [table.videoId, table.tagId],
  }
]);

export const insertFolderSchema = createInsertSchema(folders).omit({ 
  id: true, 
  userId: true, 
  createdAt: true 
});

export const insertTagSchema = createInsertSchema(tags).omit({ 
  id: true, 
  userId: true 
});

export const insertVideoSchema = createInsertSchema(videos).omit({ 
  id: true, 
  userId: true, 
  createdAt: true 
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type CreateVideoRequest = InsertVideo;
export type UpdateVideoRequest = Partial<InsertVideo>;
