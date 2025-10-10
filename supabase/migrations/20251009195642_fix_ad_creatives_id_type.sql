/*
  # Fix ad_creatives ID type mismatch

  1. Changes
    - Convert ad_creatives.id from TEXT to BIGINT to match ads.creative_id type
    - This enables proper joining between ads and ad_creatives tables
    - Preserves all existing data by casting text IDs to bigint

  2. Important Notes
    - This migration assumes all existing id values in ad_creatives are valid numeric strings
    - Foreign key relationships will work correctly after this change
*/

-- Convert the id column from text to bigint
ALTER TABLE ad_creatives 
  ALTER COLUMN id TYPE bigint USING id::bigint;
