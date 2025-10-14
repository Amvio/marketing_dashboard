import { AdInsight, DailyAggregatedMetrics, Customer, Campaign, LeadTableLead, LeadTableCampaign } from '../types/dashboard';

// Helper function to format date as YYYY-MM-DD string
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format date for display (DD.MM.YYYY)
const formatDisplayDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

export const generateDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const endDateCopy = new Date(endDate);
  
  while (currentDate <= endDateCopy) {
    dates.push(formatDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

export const getDailyAggregatedChartData = (
  adInsights: AdInsight[],
  dateRange: string[],
  selectedCustomer: Customer | null,
  selectedCampaignIds: string[],
  selectedAdsetIds: string[],
  selectedAdIds: string[],
  supabaseCampaigns: Campaign[]
): DailyAggregatedMetrics[] => {
  return dateRange.map(currentDayString => {
    
    // Filter insights for this specific day and selected hierarchy
    const dayInsights = adInsights.filter(insight => {
      // Direct string comparison with database date
      const isSameDay = insight.date === currentDayString;
      
      if (!isSameDay) return false;
      
      // Filter by selected customer's campaigns/adsets/ads
      let matchesHierarchy = true;
      
      if (selectedCampaignIds.length > 0) {
        matchesHierarchy = matchesHierarchy && selectedCampaignIds.includes(insight.campaign_id?.toString() || '');
      } else if (selectedCustomer) {
        // If no specific campaigns selected, include all campaigns for the customer
        const customerCampaignIds = supabaseCampaigns
          .filter(c => c.customer_id === selectedCustomer.customer_id)
          .map(c => c.id);
        matchesHierarchy = matchesHierarchy && customerCampaignIds.includes(insight.campaign_id || 0);
      }
      
      if (selectedAdsetIds.length > 0) {
        matchesHierarchy = matchesHierarchy && selectedAdsetIds.includes(insight.ad_set_id?.toString() || '');
      }
      
      if (selectedAdIds.length > 0) {
        matchesHierarchy = matchesHierarchy && selectedAdIds.includes(insight.ad_id?.toString() || '');
      }
      
      return matchesHierarchy;
    });
    
    // Aggregate metrics for this day
    const aggregated = dayInsights.reduce((acc, insight) => ({
      impressions: acc.impressions + (insight.impressions || 0),
      clicks: acc.clicks + (insight.clicks || 0),
      spend: acc.spend + (insight.spend || 0),
      reach: acc.reach + (insight.reach || 0),
      ctr: acc.ctr + (insight.ctr || 0),
      cpm: acc.cpm + (insight.cpm || 0),
      cpc: acc.cpc + (insight.cpc || 0),
      frequency: acc.frequency + (insight.frequency || 0)
    }), {
      impressions: 0,
      clicks: 0,
      spend: 0,
      reach: 0,
      ctr: 0,
      cpm: 0,
      cpc: 0,
      frequency: 0
    });
    
    // Calculate averages for rate metrics
    const insightCount = dayInsights.length;
    
    return {
      date: formatDisplayDate(currentDayString),
      impressions: aggregated.impressions,
      clicks: aggregated.clicks,
      spend: aggregated.spend,
      reach: aggregated.reach,
      ctr: insightCount > 0 ? aggregated.ctr / insightCount : 0,
      cpm: insightCount > 0 ? aggregated.cpm / insightCount : 0,
      cpc: insightCount > 0 ? aggregated.cpc / insightCount : 0,
      frequency: insightCount > 0 ? aggregated.frequency / insightCount : 0
    };
  });
};

// Calculate previous period date range
export const getPreviousPeriodDateRange = (startDate: Date, endDate: Date): { startDate: Date; endDate: Date } => {
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate previous period dates
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysDifference + 1);
  
  return {
    startDate: previousStartDate,
    endDate: previousEndDate
  };
};

// Generic function to calculate aggregated metrics for any period
export const getAggregatedMetricsForPeriod = (
  adInsights: AdInsight[],
  startDate: Date,
  endDate: Date,
  selectedCustomer: Customer | null,
  selectedCampaignIds: string[],
  selectedAdsetIds: string[],
  selectedAdIds: string[],
  supabaseCampaigns: Campaign[]
) => {
  // Format dates as strings for direct comparison with database
  const startDateString = formatDateString(startDate);
  const endDateString = formatDateString(endDate);
  
  // Filter insights based on selected hierarchy and date range
  const filteredInsights = adInsights.filter(insight => {
    // Filter by date range
    const isInDateRange = insight.date >= startDateString && insight.date <= endDateString;
    
    // Filter by selected customer's campaigns/adsets/ads
    let matchesHierarchy = true;
    
    if (selectedCampaignIds.length > 0) {
      matchesHierarchy = matchesHierarchy && selectedCampaignIds.includes(insight.campaign_id?.toString() || '');
    } else if (selectedCustomer) {
      // If no specific campaigns selected, include all campaigns for the customer
      const customerCampaignIds = supabaseCampaigns
        .filter(c => c.customer_id === selectedCustomer.customer_id)
        .map(c => c.id);
      matchesHierarchy = matchesHierarchy && customerCampaignIds.includes(insight.campaign_id || 0);
    }
    
    if (selectedAdsetIds.length > 0) {
      matchesHierarchy = matchesHierarchy && selectedAdsetIds.includes(insight.ad_set_id?.toString() || '');
    }
    
    if (selectedAdIds.length > 0) {
      matchesHierarchy = matchesHierarchy && selectedAdIds.includes(insight.ad_id?.toString() || '');
    }
    
    return isInDateRange && matchesHierarchy;
  });
  
  // Aggregate the metrics
  return filteredInsights.reduce((acc, insight) => ({
    impressions: acc.impressions + (insight.impressions || 0),
    clicks: acc.clicks + (insight.clicks || 0),
    spend: acc.spend + (insight.spend || 0),
    reach: acc.reach + (insight.reach || 0),
    ctr: filteredInsights.length > 0 ? 
      filteredInsights.reduce((sum, i) => sum + (i.ctr || 0), 0) / filteredInsights.length : 0,
    cpm: filteredInsights.length > 0 ? 
      filteredInsights.reduce((sum, i) => sum + (i.cpm || 0), 0) / filteredInsights.length : 0,
    cpc: filteredInsights.length > 0 ? 
      filteredInsights.reduce((sum, i) => sum + (i.cpc || 0), 0) / filteredInsights.length : 0,
    frequency: filteredInsights.length > 0 ? 
      filteredInsights.reduce((sum, i) => sum + (i.frequency || 0), 0) / filteredInsights.length : 0
  }), {
    impressions: 0,
    clicks: 0,
    spend: 0,
    reach: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    frequency: 0
  });
};

export const getLeadMetricsForPeriod = (
  leadTableLeads: LeadTableLead[],
  leadTableCampaigns: LeadTableCampaign[],
  startDate: Date,
  endDate: Date,
  selectedCustomer: Customer | null,
  selectedCampaignIds: string[]
) => {
  const startDateString = formatDateString(startDate);
  const endDateString = formatDateString(endDate);

  const customerCampaignIds = leadTableCampaigns
    .filter(c => selectedCustomer ? c.customer_id === selectedCustomer.customer_id : true)
    .map(c => c.campaign_id);

  const filteredLeads = leadTableLeads.filter(lead => {
    if (!lead.created_time) return false;

    const leadDate = lead.created_time.split('T')[0];
    const isInDateRange = leadDate >= startDateString && leadDate <= endDateString;

    let matchesHierarchy = true;

    if (selectedCampaignIds.length > 0) {
      matchesHierarchy = selectedCampaignIds.includes(lead.campaign_id);
    } else if (selectedCustomer) {
      matchesHierarchy = customerCampaignIds.includes(lead.campaign_id);
    }

    return isInDateRange && matchesHierarchy;
  });

  const totalLeads = filteredLeads.length;
  const qualifiedLeads = filteredLeads.filter(lead => lead.qualified === 'YES').length;
  const customerDenied = filteredLeads.filter(lead => lead.customer_denied === 'YES').length;

  const leadQuality = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
  const followUpRate = customerDenied;

  return {
    totalLeads,
    qualifiedLeads,
    customerDenied,
    leadQuality,
    followUpRate
  };
};

export const getDailyLeadCounts = (
  leadTableLeads: LeadTableLead[],
  leadTableCampaigns: LeadTableCampaign[],
  dateRange: string[],
  selectedCustomer: Customer | null,
  selectedCampaignIds: string[]
) => {
  const customerCampaignIds = leadTableCampaigns
    .filter(c => selectedCustomer ? c.customer_id === selectedCustomer.customer_id : true)
    .map(c => c.campaign_id);

  return dateRange.map(currentDayString => {
    const dayLeads = leadTableLeads.filter(lead => {
      if (!lead.created_time) return false;

      const leadDate = lead.created_time.split('T')[0];
      const isSameDay = leadDate === currentDayString;

      if (!isSameDay) return false;

      let matchesHierarchy = true;

      if (selectedCampaignIds.length > 0) {
        matchesHierarchy = selectedCampaignIds.includes(lead.campaign_id);
      } else if (selectedCustomer) {
        matchesHierarchy = customerCampaignIds.includes(lead.campaign_id);
      }

      return matchesHierarchy;
    });

    const totalLeads = dayLeads.length;
    const qualifiedLeads = dayLeads.filter(lead => lead.qualified === 'YES').length;
    const customerDenied = dayLeads.filter(lead => lead.customer_denied === 'YES').length;

    return {
      date: formatDisplayDate(currentDayString),
      totalLeads,
      qualifiedLeads,
      customerDenied,
      leadQuality: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
      followUpRate: customerDenied
    };
  });
};