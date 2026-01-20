-- Migration: Add video_tags table and notes field
-- This migration ensures all Phase 2 and Phase 4 features are properly set up

-- Add notes column to videos table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'notes'
    ) THEN
        ALTER TABLE videos ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Create video_tags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS video_tags (
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_folder_id ON videos(folder_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Verify the schema
SELECT 
    'videos' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'videos'
ORDER BY ordinal_position;

SELECT 
    'video_tags' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'video_tags'
ORDER BY ordinal_position;
