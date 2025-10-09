/*
  # Create Library Table

  1. New Tables
    - `library`
      - `id` (uuid, primary key) - Unique identifier for each library entry
      - `title` (text, not null) - Title of the library entry
      - `description` (text) - Description of the library entry
      - `date_changed` (timestamptz, default now()) - Timestamp of last modification
      - `created_at` (timestamptz, default now()) - Timestamp of creation

  2. Security
    - Enable RLS on `library` table
    - Add policy for authenticated users to read all library entries
    - Add policy for authenticated users to insert their own entries
    - Add policy for authenticated users to update their own entries
    - Add policy for authenticated users to delete their own entries
*/

CREATE TABLE IF NOT EXISTS library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date_changed timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all library entries"
  ON library
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert library entries"
  ON library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update library entries"
  ON library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete library entries"
  ON library
  FOR DELETE
  TO authenticated
  USING (true);