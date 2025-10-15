import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchAllPages<T>(
  tableName: string,
  selectQuery: string = '*',
  orderColumn?: string,
  orderAscending: boolean = false
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = supabase
      .from(tableName)
      .select(selectQuery)
      .range(start, end);

    if (orderColumn) {
      query = query.order(orderColumn, { ascending: orderAscending });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allData.length} total rows from ${tableName}`);
  return allData;
}

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