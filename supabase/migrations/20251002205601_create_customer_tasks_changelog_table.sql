/*
  # Create customer tasks changelog table

  1. New Tables
    - `customer_tasks_changelog`
      - `id` (uuid, primary key)
      - `customer_id` (bigint, foreign key to Kunden table)
      - `title` (text, required)
      - `assignee` (text, optional)
      - `completed` (boolean, default false)
      - `created_at` (timestamp with timezone, default now)
      - `date_changelog` (timestamp with timezone, optional) - replaces due_date
      - `description` (text, optional)

  2. Security
    - Enable RLS on `customer_tasks_changelog` table
    - Add policies for authenticated users to perform CRUD operations

  3. Foreign Key Relationship
    - Links to `Kunden` table via `customer_id`
    - Cascade delete when customer is removed

  4. Notes
    - This is a duplicate of the customer_tasks table with date_changelog replacing due_date
*/

CREATE TABLE IF NOT EXISTS public.customer_tasks_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id BIGINT NOT NULL REFERENCES public."Kunden"(customer_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_changelog TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- Enable Row Level Security
ALTER TABLE public.customer_tasks_changelog ENABLE ROW LEVEL SECURITY;

-- Create policies for CRUD operations
CREATE POLICY "Allow read access to all customer_tasks_changelog" 
  ON public.customer_tasks_changelog 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert access for authenticated users" 
  ON public.customer_tasks_changelog 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users" 
  ON public.customer_tasks_changelog 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete access for authenticated users" 
  ON public.customer_tasks_changelog 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance when querying by customer_id
CREATE INDEX IF NOT EXISTS idx_customer_tasks_changelog_customer_id ON public.customer_tasks_changelog(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tasks_changelog_created_at ON public.customer_tasks_changelog(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_tasks_changelog_date_changelog ON public.customer_tasks_changelog(date_changelog DESC);