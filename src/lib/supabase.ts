import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Customer {
  customer_id: number;
  customer_created_at: string;
  customer_branch: string | null;
  customer_contact_person: string | null;
  contact_email: string | null;
  customer_contact_phone: string | null;
  customer_adress: string | null;
  customer_website: string | null;
  customer_name: string | null;
  customer_company_name: string | null;
  logo_url: string | null;
  status: string | null;
}