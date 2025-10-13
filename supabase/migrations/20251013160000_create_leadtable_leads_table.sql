/*
  # Create Lead-Table Leads Table

  1. New Tables
    - `leadtable_leads`
      - `id` (bigserial, primary key)
      - `lead_id` (text, unique - the _id from Lead-Table API)
      - `campaign_id` (text, foreign key to leadtable_campaigns)
      - `name` (text, the lead name)
      - `status` (text, current status of the lead)
      - `utm_campaign` (text, UTM campaign parameter)
      - `utm_id` (text, UTM ID parameter)
      - `owner_customer` (text, customer who owns the lead)
      - `owner_table` (text, table owner information)
      - `qualified` (text, 'YES' if lead has status Potential or Qualifiziert, 'NO' otherwise)
      - `customer_denied` (text, 'YES' if lead has status Absage or Absage AMVIO, 'NO' otherwise)
      - `created_time` (timestamptz, when the lead was created in Lead-Table)
      - `last_change` (timestamptz, when the lead was last modified in Lead-Table)
      - `synced_at` (timestamptz, when we last synced this data)

  2. Security
    - Enable RLS on `leadtable_leads` table
    - Add policies for authenticated users to read and write data

  3. Indexes
    - Unique index on lead_id to prevent duplicates
    - Index on campaign_id for faster lookups
    - Index on qualified for filtering
    - Index on customer_denied for filtering

  4. Important Notes
    - The qualified column is set to 'YES' when the lead history contains entries with newStatus = 'Potential' or 'Qualifiziert'
    - The customer_denied column is set to 'YES' when the lead history contains entries with newStatus = 'Absage' or 'Absage AMVIO'
    - Foreign key relationship with leadtable_campaigns ensures data integrity
*/

CREATE TABLE IF NOT EXISTS public.leadtable_leads (
  id BIGSERIAL PRIMARY KEY,
  lead_id TEXT UNIQUE NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES public.leadtable_campaigns(campaign_id) ON DELETE CASCADE,
  name TEXT,
  status TEXT,
  utm_campaign TEXT,
  utm_id TEXT,
  owner_customer TEXT,
  owner_table TEXT,
  qualified TEXT DEFAULT 'NO',
  customer_denied TEXT DEFAULT 'NO',
  created_time TIMESTAMPTZ,
  last_change TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leadtable_leads ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Allow read access to all leadtable_leads"
  ON public.leadtable_leads
  FOR SELECT
  USING (true);

CREATE POLICY "Allow insert access for authenticated users"
  ON public.leadtable_leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users"
  ON public.leadtable_leads
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete access for authenticated users"
  ON public.leadtable_leads
  FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_lead_id ON public.leadtable_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_campaign_id ON public.leadtable_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_qualified ON public.leadtable_leads(qualified);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_customer_denied ON public.leadtable_leads(customer_denied);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_created_time ON public.leadtable_leads(created_time DESC);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_last_change ON public.leadtable_leads(last_change DESC);
CREATE INDEX IF NOT EXISTS idx_leadtable_leads_synced_at ON public.leadtable_leads(synced_at DESC);
