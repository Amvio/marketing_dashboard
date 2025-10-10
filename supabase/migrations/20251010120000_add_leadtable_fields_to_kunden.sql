/*
  # Add Lead-Table Integration Fields to Kunden Table

  1. Changes
    - Add `leadtable_id` column to store Lead-Table customer IDs
    - Add `source` column to track data source (e.g., "Leadtable")

  2. Notes
    - Uses conditional logic to only add columns if they don't exist
    - `leadtable_id` is unique to prevent duplicate entries from Lead-Table
    - Both fields are optional (nullable) to support existing customers
*/

DO $$
BEGIN
  -- Add leadtable_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Kunden'
    AND column_name = 'leadtable_id'
  ) THEN
    ALTER TABLE public."Kunden" ADD COLUMN leadtable_id text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_kunden_leadtable_id ON public."Kunden"(leadtable_id) WHERE leadtable_id IS NOT NULL;
  END IF;

  -- Add source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Kunden'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public."Kunden" ADD COLUMN source text;
  END IF;
END $$;
