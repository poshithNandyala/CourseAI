/*
  # Add video_data column to lessons table

  1. Changes
    - Add video_data JSONB column to lessons table to store YouTube video information
    - This will store complete video metadata including URLs, thumbnails, etc.

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add video_data column to store YouTube video information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'video_data'
  ) THEN
    ALTER TABLE lessons ADD COLUMN video_data JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;