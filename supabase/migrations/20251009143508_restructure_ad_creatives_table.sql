/*
  # Restructure ad_creatives table

  1. Changes
    - Remove columns: object_story_spec, asset_feed_spec, body, link
    - Add column: url (text) - stores the URL from creative specs
    - Ensure columns exist: message, description, hash
    - Keep existing columns: id, name, title, image_url, video_url, call_to_action, created_time
    
  2. Final Schema
    - id (text, primary key)
    - name (text)
    - title (text)
    - message (text)
    - description (text)
    - url (text)
    - hash (text)
    - image_url (text)
    - video_url (text)
    - call_to_action (text)
    - created_time (timestamp)
*/

-- Drop columns that are no longer needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'object_story_spec'
  ) THEN
    ALTER TABLE ad_creatives DROP COLUMN object_story_spec;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'asset_feed_spec'
  ) THEN
    ALTER TABLE ad_creatives DROP COLUMN asset_feed_spec;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'body'
  ) THEN
    ALTER TABLE ad_creatives DROP COLUMN body;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'link'
  ) THEN
    ALTER TABLE ad_creatives DROP COLUMN link;
  END IF;
END $$;

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'url'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN url text;
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
END $$;