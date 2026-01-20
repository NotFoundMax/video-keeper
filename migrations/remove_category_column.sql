-- Remove category column from videos table
ALTER TABLE videos DROP COLUMN IF EXISTS category;
