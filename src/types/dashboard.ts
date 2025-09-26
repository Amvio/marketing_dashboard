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
  title: string;
  assignee: string;
  completed: boolean;
  createdAt: Date;
}

export interface AdInsight {
  id: number;
  ad_id: number | null;
  ad_set_id: number | null;
  campaign_id: number | null;
  date: string;
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  reach: number | null;
  frequency: number | null;
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