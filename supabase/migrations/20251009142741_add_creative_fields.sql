/*
  # Add new fields to ad_creatives table

  1. Changes
    - Add `link` column to store link from object_story_spec or asset_feed_spec
    - Add `message` column to store message text from object_story_spec
    - Add `description` column to store description text from object_story_spec or asset_feed_spec
    - Add `hash` column to store image/video hash from object_story_spec or asset_feed_spec
    - Add `asset_feed_spec` column to store asset feed spec JSON data
    
  2. Purpose
    - Enable storage of additional creative data from Meta Graph API
    - Support both object_story_spec and asset_feed_spec formats
    - Allow extraction of specific fields for easier querying
*/

-- Add new columns to ad_creatives table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'link'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'message'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'description'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'hash'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN hash text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'asset_feed_spec'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN asset_feed_spec jsonb;
  END IF;
END $$;