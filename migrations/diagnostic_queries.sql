-- Diagnostic queries for Video Keeper database
-- Run these queries in Supabase SQL Editor to check the database state

-- 1. Check if video_tags table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'video_tags'
) as video_tags_exists;

-- 2. Check videos table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'videos'
ORDER BY ordinal_position;

-- 3. Check tags table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tags'
ORDER BY ordinal_position;

-- 4. Check video_tags table structure (if exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_tags'
ORDER BY ordinal_position;

-- 5. Count records in each table
SELECT 
    'videos' as table_name,
    COUNT(*) as record_count
FROM videos
UNION ALL
SELECT 
    'tags' as table_name,
    COUNT(*) as record_count
FROM tags
UNION ALL
SELECT 
    'video_tags' as table_name,
    COUNT(*) as record_count
FROM video_tags;

-- 6. Check for videos with tags
SELECT 
    v.id,
    v.title,
    COUNT(vt.tag_id) as tag_count
FROM videos v
LEFT JOIN video_tags vt ON v.id = vt.video_id
GROUP BY v.id, v.title
ORDER BY tag_count DESC
LIMIT 10;

-- 7. Check for tags and their usage
SELECT 
    t.id,
    t.name,
    t.color,
    COUNT(vt.video_id) as video_count
FROM tags t
LEFT JOIN video_tags vt ON t.id = vt.tag_id
GROUP BY t.id, t.name, t.color
ORDER BY video_count DESC;

-- 8. Check for orphaned relationships
SELECT 'Orphaned video_tags (no video)' as issue, COUNT(*) as count
FROM video_tags vt
LEFT JOIN videos v ON vt.video_id = v.id
WHERE v.id IS NULL
UNION ALL
SELECT 'Orphaned video_tags (no tag)' as issue, COUNT(*) as count
FROM video_tags vt
LEFT JOIN tags t ON vt.tag_id = t.id
WHERE t.id IS NULL;
