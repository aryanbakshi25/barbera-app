-- Migration to add multi-photo support to posts table
-- Run this in your Supabase SQL editor

-- Add the images column (using jsonb for flexibility and performance)
ALTER TABLE posts ADD COLUMN images JSONB;

-- Update existing posts to migrate image_url to images array
UPDATE posts 
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND images IS NULL;

-- Optional: Add a constraint to ensure at least one image
ALTER TABLE posts ADD CONSTRAINT posts_images_not_empty CHECK (jsonb_array_length(images) > 0);

-- Optional: Keep image_url for backward compatibility (you can remove this later)
-- ALTER TABLE posts DROP COLUMN image_url; 