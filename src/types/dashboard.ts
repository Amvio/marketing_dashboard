export interface Customer {
  customer_id: number;
  customer_name: string | null;
  customer_company_name: string | null;
  customer_branch: string | null;
  customer_contact_person: string | null;
  contact_email: string | null;
  customer_contact_phone: string | null;
  customer_adress: string | null;
  customer_website: string | null;
  logo_url: string | null;
  customer_created_at: string;
  leadtable_id?: string | null;
  source?: string | null;
}

export interface MetaAdsMetrics {
  clicks: number;
  reach: number;
  impressions: number;
  interactions: number;
  linkClicks: number;
  leads: number;
  pageEngagement: number;
}

export interface AdPerformance {
  id: string;
  name: string;
  imageUrl: string;
  impressions: number;
  leads: number;
  ctr: number;
  linkClickThroughRate: number;
}

export interface ChartDataPoint {
  date: string;
  leads: number;
}

export interface Adset {
  id: number;
  campaign_id: number | null;
  name: string;
  status: string | null;
  optimization_goal: string | null;
  bid_strategy: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_time: string | null;
  end_time: string | null;
  created_time: string | null;
}

export interface Campaign {
  id: number;
  ad_account_id: number | null;
  customer_id: number | null;
  name: string;
  status: string | null;
  objective: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_time: string | null;
  end_time: string | null;
  created_time: string | null;
}

export interface Ad {
  id: number;
  ad_set_id: number | null;
  name: string;
  status: string | null;
  creative_id: number | null;
  effective_status: string | null;
  created_time: string | null;
}

export interface Task {
  id: string;
  customer_id: number;
  title: string;
  assignee: string;
  completed: boolean;
  created_at: string;
  due_date?: string | null;
  description?: string | null;
}

export interface AdInsight {
  id: number;
  ad_id: number | null;
  ad_set_id: number | null;
  campaign_id: number | null;
  date: string;
  ad_name: string | null;
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  cpp: number | null;
  reach: number | null;
  frequency: number | null;
  conversions: number | null;
  attribution_setting: string | null;
}

export interface DailyAggregatedMetrics {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpm: number;
  cpc: number;
  frequency: number;
}

export interface LeadTableLead {
  id: number;
  lead_id: string;
  campaign_id: string;
  name: string | null;
  status: string | null;
  utm_campaign: string | null;
  utm_id: string | null;
  owner_customer: string | null;
  owner_table: string | null;
  qualified: string;
  customer_denied: string;
  created_time: string | null;
  last_change: string | null;
  synced_at: string;
}

export interface LeadTableCampaign {
  id: number;
  campaign_id: string;
  customer_id: number | null;
  leadtable_customer_id: string;
  occupation: string | null;
  archived: boolean;
  leads_count: number;
  created_at: string | null;
  last_change: string | null;
  synced_at: string;
}