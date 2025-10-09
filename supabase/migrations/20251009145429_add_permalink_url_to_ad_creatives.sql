/*
  # Add permalink_url column to ad_creatives table

  1. Changes
    - Add permalink_url column to store the permalink URL from Meta Graph API ad images endpoint
    
  2. Purpose
    - Enable storage of permalink URLs fetched via the ad images API using hash values
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_creatives' AND column_name = 'permalink_url'
  ) THEN
    ALTER TABLE ad_creatives ADD COLUMN permalink_url text;
  END IF;
END $$;