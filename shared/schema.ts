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
  isFavorite: boolean("is_favorite").default(false),
  aspectRatio: text("aspect_ratio").default("auto"), // 'auto', 'horizontal', 'vertical', 'square'
  lastTimestamp: integer("last_timestamp").default(0), // Saved progress in seconds
  notes: text("notes"), // User notes about the video
  embedHtml: text("embed_html"), // Specific oEmbed HTML for platforms like Instagram
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

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  autoAdd: boolean("auto_add").default(false), // Auto-add videos with matching tags
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playlistTags = pgTable("playlist_tags", {
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  {
    pk: [table.playlistId, table.tagId],
  }
]);

export const playlistVideos = pgTable("playlist_videos", {
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: 'cascade' }),
  position: integer("position").notNull(), // Order in playlist
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => [
  {
    pk: [table.playlistId, table.videoId],
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

export const insertPlaylistSchema = createInsertSchema(playlists).omit({ 
  id: true, 
  userId: true, 
  createdAt: true,
  updatedAt: true
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type CreatePlaylistRequest = InsertPlaylist;
export type UpdatePlaylistRequest = Partial<InsertPlaylist>;
