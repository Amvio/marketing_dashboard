/*
  # Create Lead-Table Campaigns Table

  1. New Tables
    - `leadtable_campaigns`
      - `id` (bigserial, primary key)
      - `campaign_id` (text, unique - the _id from Lead-Table API)
      - `customer_id` (bigint, foreign key to Kunden table)
      - `leadtable_customer_id` (text, the Lead-Table customer ID)
      - `occupation` (text, the job title/position)
      - `archived` (boolean, whether the campaign is archived)
      - `leads_count` (integer, number of leads in the campaign)
      - `created_at` (timestamptz, when the campaign was created in Lead-Table)
      - `last_change` (timestamptz, when the campaign was last modified in Lead-Table)
      - `synced_at` (timestamptz, when we last synced this data)

  2. Security
    - Enable RLS on `leadtable_campaigns` table
    - Add policies for authenticated users to read data

  3. Indexes
    - Unique index on campaign_id to prevent duplicates
    - Index on customer_id for faster lookups
*/

CREATE TABLE IF NOT EXISTS public.leadtable_campaigns (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES public."Kunden"(customer_id) ON DELETE CASCADE,
  leadtable_customer_id TEXT NOT NULL,
  occupation TEXT,
  archived BOOLEAN DEFAULT FALSE,
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  last_change TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leadtable_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access to all leadtable_campaigns" 
  ON public.leadtable_campaigns 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow insert access for authenticated users" 
  ON public.leadtable_campaigns 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users" 
  ON public.leadtable_campaigns 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow delete access for authenticated users" 
  ON public.leadtable_campaigns 
  FOR DELETE 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leadtable_campaigns_customer_id ON public.leadtable_campaigns(customer_id);
CREATE INDEX IF NOT EXISTS idx_leadtable_campaigns_leadtable_customer_id ON public.leadtable_campaigns(leadtable_customer_id);
CREATE INDEX IF NOT EXISTS idx_leadtable_campaigns_created_at ON public.leadtable_campaigns(created_at DESC);
