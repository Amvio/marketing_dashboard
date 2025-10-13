/*
  # Add Status Column to Kunden Table

  1. Changes
    - Add `status` column to Kunden table with text type
    - Set default value to 'Aktiv'
    - Add check constraint to only allow 'Aktiv' or 'Inaktive' values
    - Create index on status column for better query performance

  2. Notes
    - Uses conditional logic to only add column if it doesn't exist
    - Check constraint ensures data integrity by limiting allowed values
    - Default value of 'Aktiv' ensures all existing and new customers are active by default
    - Index improves performance when filtering customers by status
*/

DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'Kunden'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public."Kunden" ADD COLUMN status text DEFAULT 'Aktiv';
    
    -- Add check constraint to ensure only valid status values
    ALTER TABLE public."Kunden" 
      ADD CONSTRAINT check_kunden_status 
      CHECK (status IN ('Aktiv', 'Inaktive'));
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_kunden_status ON public."Kunden"(status);
  END IF;
END $$;