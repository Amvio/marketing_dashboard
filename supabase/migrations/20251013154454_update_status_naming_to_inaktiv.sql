/*
  # Update Status Naming from 'Inaktive' to 'Inaktiv'

  1. Changes
    - Drop existing check constraint for status column first
    - Update existing 'Inaktive' values to 'Inaktiv' in Kunden table
    - Add new check constraint with correct naming: 'Aktiv' or 'Inaktiv'

  2. Notes
    - This corrects the German grammar for the status field
    - Drops constraint before updating data to avoid conflicts
    - Ensures data integrity with the updated constraint
*/

DO $$
BEGIN
  -- Drop the existing check constraint first if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_kunden_status'
    AND table_name = 'Kunden'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public."Kunden" DROP CONSTRAINT check_kunden_status;
  END IF;

  -- Update any existing 'Inaktive' values to 'Inaktiv'
  UPDATE public."Kunden" SET status = 'Inaktiv' WHERE status = 'Inaktive';

  -- Add new check constraint with correct naming
  ALTER TABLE public."Kunden" 
    ADD CONSTRAINT check_kunden_status 
    CHECK (status IN ('Aktiv', 'Inaktiv'));
END $$;