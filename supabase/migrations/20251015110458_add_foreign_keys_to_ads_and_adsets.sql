/*
  # Add Foreign Keys for Ads and Ad Sets

  1. Changes
    - Clean up orphaned records first
    - Add foreign key from ad_sets.campaign_id to campaigns.id
    - Add foreign key from ads.ad_set_id to ad_sets.id
  
  2. Purpose
    - Enable proper joins in Supabase queries
    - Maintain referential integrity
    - Allow nested select queries with customer relationships
*/

-- Delete orphaned ads (ads that reference non-existent ad_sets)
DELETE FROM ads
WHERE NOT EXISTS (
  SELECT 1 FROM ad_sets WHERE ad_sets.id = ads.ad_set_id
);

-- Delete orphaned ad_sets (ad_sets that reference non-existent campaigns)
DELETE FROM ad_sets
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE campaigns.id = ad_sets.campaign_id
);

-- Add foreign key from ad_sets to campaigns if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ad_sets_campaign_id_fkey'
    AND table_name = 'ad_sets'
  ) THEN
    ALTER TABLE ad_sets
    ADD CONSTRAINT ad_sets_campaign_id_fkey
    FOREIGN KEY (campaign_id)
    REFERENCES campaigns(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from ads to ad_sets if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ads_ad_set_id_fkey'
    AND table_name = 'ads'
  ) THEN
    ALTER TABLE ads
    ADD CONSTRAINT ads_ad_set_id_fkey
    FOREIGN KEY (ad_set_id)
    REFERENCES ad_sets(id)
    ON DELETE CASCADE;
  END IF;
END $$;
