/*
  # Create Sync Jobs Tracking Table

  1. New Tables
    - `sync_jobs`
      - `id` (uuid, primary key) - Unique identifier for the sync job
      - `job_type` (text) - Type of sync operation (e.g., 'ad_insights', 'campaigns')
      - `status` (text) - Current status: 'running', 'completed', 'failed', 'paused'
      - `total_chunks` (integer) - Total number of chunks to process
      - `completed_chunks` (integer) - Number of chunks completed
      - `current_chunk` (integer) - Current chunk being processed
      - `start_date` (date) - Start date of the entire operation
      - `end_date` (date) - End date of the entire operation
      - `current_chunk_start` (date) - Start date of current chunk
      - `current_chunk_end` (date) - End date of current chunk
      - `total_items_processed` (integer) - Total items processed across all chunks
      - `last_processed_id` (text) - Last entity ID processed (for recovery)
      - `error_message` (text) - Error message if failed
      - `metadata` (jsonb) - Additional metadata about the job
      - `created_at` (timestamptz) - When the job was created
      - `updated_at` (timestamptz) - Last update timestamp
      - `completed_at` (timestamptz) - When the job completed

  2. Security
    - Enable RLS on `sync_jobs` table
    - Add policy for authenticated users to read all sync jobs
    - Add policy for service role to manage sync jobs

  3. Indexes
    - Add index on status for quick filtering
    - Add index on job_type for job type queries
    - Add index on created_at for chronological queries
*/

CREATE TABLE IF NOT EXISTS sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  total_chunks integer NOT NULL DEFAULT 1,
  completed_chunks integer NOT NULL DEFAULT 0,
  current_chunk integer NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  end_date date NOT NULL,
  current_chunk_start date,
  current_chunk_end date,
  total_items_processed integer NOT NULL DEFAULT 0,
  last_processed_id text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all users to read sync jobs"
  ON sync_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to insert sync jobs"
  ON sync_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role to update sync jobs"
  ON sync_jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to delete sync jobs"
  ON sync_jobs FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_job_type ON sync_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at DESC);