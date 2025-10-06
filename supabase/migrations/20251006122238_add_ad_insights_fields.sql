/*
  # Add missing fields to ad_insights table

  1. Changes to ad_insights table
    - Add `ad_name` (text) - The name of the ad
    - Add `conversions` (numeric) - Number of conversions
    - Add `cpp` (numeric) - Cost per purchase/conversion
    - Add `attribution_setting` (text) - Attribution settings used for the insights

  2. Indexes
    - Create index on date column for efficient date-based queries
    - Create composite index on (ad_id, date) for upsert operations

  3. Notes
    - All new fields are nullable to handle cases where data might not be available
    - Uses IF NOT EXISTS to prevent errors if fields already exist
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_insights' AND column_name = 'ad_name'
  ) THEN
    ALTER TABLE ad_insights ADD COLUMN ad_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_insights' AND column_name = 'conversions'
  ) THEN
    ALTER TABLE ad_insights ADD COLUMN conversions NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_insights' AND column_name = 'cpp'
  ) THEN
    ALTER TABLE ad_insights ADD COLUMN cpp NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_insights' AND column_name = 'attribution_setting'
  ) THEN
    ALTER TABLE ad_insights ADD COLUMN attribution_setting TEXT;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ad_insights_date ON ad_insights(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_insights_ad_id_date ON ad_insights(ad_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_insights_adset_id ON ad_insights(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_ad_insights_campaign_id ON ad_insights(campaign_id);
