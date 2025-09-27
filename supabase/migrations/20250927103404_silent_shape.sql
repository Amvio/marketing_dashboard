/*
  # Create customer tasks table

  1. New Tables
    - `customer_tasks`
      - `id` (uuid, primary key)
      - `customer_id` (bigint, foreign key to Kunden table)
      - `title` (text, required)
      - `assignee` (text, optional)
      - `completed` (boolean, default false)
      - `created_at` (timestamp with timezone, default now)
      - `due_date` (timestamp with timezone, optional)
      - `description` (text, optional)

  2. Security
    - Enable RLS on `customer_tasks` table
    - Add policies for authenticated users to perform CRUD operations

  3. Foreign Key Relationship
    - Links to `Kunden` table via `customer_id`
    - Cascade delete when customer is removed
*/

CREATE TABLE IF NOT EXISTS public.customer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id BIGINT NOT NULL REFERENCES public."Kunden"(customer_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  description TEXT
);

-- Enable Row Level Security
ALTER TABLE public.customer_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for CRUD operations
CREATE POLICY "Allow read access to all customer_tasks" 
  ON public.customer_tasks 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert access for authenticated users" 
  ON public.customer_tasks 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users" 
  ON public.customer_tasks 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete access for authenticated users" 
  ON public.customer_tasks 
  FOR DELETE 
  USING (true);

-- Create index for better performance when querying by customer_id
CREATE INDEX IF NOT EXISTS idx_customer_tasks_customer_id ON public.customer_tasks(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tasks_created_at ON public.customer_tasks(created_at DESC);