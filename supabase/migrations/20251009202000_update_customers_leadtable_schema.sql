/*
  # Update customers_leadtable Schema for Lead-Table API Integration

  1. Schema Changes
    - Add comprehensive customer data columns to store Lead-Table API response:
      - `customer_id` (text, unique identifier from API)
      - `name` (text, customer name)
      - `email` (text, customer email)
      - `phone` (text, customer phone number)
      - `status` (text, customer status)
      - `lead_source` (text, where the lead came from)
      - `company` (text, company name if applicable)
      - `address` (text, customer address)
      - `city` (text, city)
      - `country` (text, country)
      - `notes` (text, additional notes)
      - `tags` (jsonb, array of tags)
      - `custom_fields` (jsonb, additional custom fields)
      - `raw_data` (jsonb, complete JSON response from API)
      - `last_synced_at` (timestamptz, timestamp of last sync)
      - `api_created_at` (timestamptz, creation time from API)
      - `api_updated_at` (timestamptz, last update time from API)

  2. Indexes
    - Add index on customer_id for fast lookups
    - Add index on email for searching
    - Add index on last_synced_at for sync tracking

  3. Security
    - Add policies for update operations
    - Add policies for delete operations
    - Maintain existing RLS policies for read and insert
*/

-- Add new columns to customers_leadtable table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN customer_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'name'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'email'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'phone'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'status'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN status text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN lead_source text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'company'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN company text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'address'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'city'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'country'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'notes'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'tags'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN raw_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN last_synced_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'api_created_at'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN api_created_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers_leadtable' AND column_name = 'api_updated_at'
  ) THEN
    ALTER TABLE customers_leadtable ADD COLUMN api_updated_at timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_leadtable_customer_id
  ON customers_leadtable(customer_id);

CREATE INDEX IF NOT EXISTS idx_customers_leadtable_email
  ON customers_leadtable(email);

CREATE INDEX IF NOT EXISTS idx_customers_leadtable_last_synced
  ON customers_leadtable(last_synced_at DESC);

-- Add update policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers_leadtable'
    AND policyname = 'Authenticated users can update lead data'
  ) THEN
    CREATE POLICY "Authenticated users can update lead data"
      ON customers_leadtable
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add delete policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers_leadtable'
    AND policyname = 'Authenticated users can delete lead data'
  ) THEN
    CREATE POLICY "Authenticated users can delete lead data"
      ON customers_leadtable
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
