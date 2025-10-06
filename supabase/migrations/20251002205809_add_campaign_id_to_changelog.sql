/*
  # Add campaign connection to changelog table

  1. Changes
    - Add `campaign_id` column (text, optional, foreign key to campaigns table)
    - Create foreign key relationship to campaigns table
    - Add index for performance when querying by campaign_id

  2. Notes
    - campaign_id is optional (nullable) so tasks can exist without being tied to a campaign
    - Uses ON DELETE SET NULL so tasks remain if campaign is deleted
    - campaigns.id is TEXT type, so campaign_id must also be TEXT
*/

-- Add campaign_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'changelog' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE public.changelog 
    ADD COLUMN campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance when querying by campaign_id
CREATE INDEX IF NOT EXISTS idx_changelog_campaign_id ON public.changelog(campaign_id);