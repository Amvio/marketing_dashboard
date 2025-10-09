/*
  # Create customers_leadtable

  1. New Tables
    - `customers_leadtable`
      - `id` (bigint, primary key, auto-increment)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on `customers_leadtable` table
    - Add policy for authenticated users to read all data
    - Add policy for authenticated users to insert data
*/

CREATE TABLE IF NOT EXISTS customers_leadtable (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers_leadtable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all lead data"
  ON customers_leadtable
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lead data"
  ON customers_leadtable
  FOR INSERT
  TO authenticated
  WITH CHECK (true);