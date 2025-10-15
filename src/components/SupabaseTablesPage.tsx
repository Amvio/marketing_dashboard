import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, ArrowLeft, Table, Eye, CheckCircle, XCircle, RefreshCw, Search, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupabaseTablesPageProps {
  onBack: () => void;
  addConsoleMessage?: (message: string) => void;
}

interface TableData {
  [key: string]: any;
}

export const SupabaseTablesPage: React.FC<SupabaseTablesPageProps> = ({ onBack, addConsoleMessage }) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tableData, setTableData] = useState<Record<string, TableData[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | null>>({});
  const [loadingAdAccountsAbfrage, setLoadingAdAccountsAbfrage] = useState(false);
  const [loadingCampaignsAbfrage, setLoadingCampaignsAbfrage] = useState(false);
  const [loadingAdsetsAbfrage, setLoadingAdsetsAbfrage] = useState(false);
  const [loadingAdsAbfrage, setLoadingAdsAbfrage] = useState(false);
  const [loadingCreativesAbfrage, setLoadingCreativesAbfrage] = useState(false);
  const [loadingCreativeImagesAbfrage, setLoadingCreativeImagesAbfrage] = useState(false);
  const [loadingKundenAbfrage, setLoadingKundenAbfrage] = useState(false);
  const [loadingLeadtableCampaignsAbfrage, setLoadingLeadtableCampaignsAbfrage] = useState(false);
  const [loadingLeadtableLeadsAbfrage, setLoadingLeadtableLeadsAbfrage] = useState(false);
  const [loadingInsightsAbfrage, setLoadingInsightsAbfrage] = useState(false);
  const [showAdsetStatusPopup, setShowAdsetStatusPopup] = useState(false);
  const [showCreativesStatusPopup, setShowCreativesStatusPopup] = useState(false);
  const [showCreativeImagesPopup, setShowCreativeImagesPopup] = useState(false);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>('');
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [showInsightsStatusPopup, setShowInsightsStatusPopup] = useState(false);
  const [insightsStartDate, setInsightsStartDate] = useState<string>('');
  const [insightsEndDate, setInsightsEndDate] = useState<string>('');
  const [loadingInsightsDateInit, setLoadingInsightsDateInit] = useState(false);
  const [insightsStatusFilter, setInsightsStatusFilter] = useState<'active' | 'all'>('all');
  const [showLeadsSelectionPopup, setShowLeadsSelectionPopup] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loadingLeadsForCustomers, setLoadingLeadsForCustomers] = useState(false);
  const [showAdsSelectionPopup, setShowAdsSelectionPopup] = useState(false);
  const [selectedAdsets, setSelectedAdsets] = useState<Set<string>>(new Set());
  const [adsetsList, setAdsetsList] = useState<any[]>([]);
  const [loadingAdsForAdsets, setLoadingAdsForAdsets] = useState(false);
  const [selectedInsightsAdsets, setSelectedInsightsAdsets] = useState<Set<string>>(new Set());
  const [insightsAdsetsList, setInsightsAdsetsList] = useState<any[]>([]);

  // Standalone handler for ad_accounts Abfrage
  const handleAbfrageAdAccounts = async () => {
    setLoadingAdAccountsAbfrage(true);
    addConsoleMessage?.('Calling Netlify function for ad_accounts...');
    
    try {
      console.log('Calling Netlify function for ad_accounts...');
      const response = await fetch('/api/get_ad_accounts?table=ad_accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);
      
      // Refresh the ad_accounts table data after successful sync
      await fetchTableData('ad_accounts');
      addConsoleMessage?.('Ad accounts table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAdAccountsAbfrage(false);
    }
  };

  // Standalone handler for campaigns Abfrage
  const handleAbfrageCampaigns = async () => {
    setLoadingCampaignsAbfrage(true);
    addConsoleMessage?.('Calling Netlify function for campaigns...');
    
    try {
      console.log('Calling Netlify function for campaigns...');
      const response = await fetch('/api/get_campaigns', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);
      
      // Refresh the campaigns table data after successful sync
      await fetchTableData('campaigns');
      addConsoleMessage?.('Campaigns table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingCampaignsAbfrage(false);
    }
  };

  // Standalone handler for adsets Abfrage
  const handleAbfrageAdsets = async () => {
    setLoadingAdsetsAbfrage(true);
    addConsoleMessage?.('Calling Netlify function for adsets...');
    
    try {
      console.log('Calling Netlify function for adsets...');
      const response = await fetch('/api/get_adsets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);
      
      // Refresh the ad_sets table data after successful sync
      await fetchTableData('ad_sets');
      addConsoleMessage?.('Ad sets table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAdsetsAbfrage(false);
    }
  };

  const handleOpenAdsSelection = async () => {
    setShowAdsSelectionPopup(true);

    try {
      const { data: adsets, error } = await supabase
        .from('ad_sets')
        .select('id, name, status')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching adsets:', error);
        addConsoleMessage?.(`Error fetching adsets: ${error.message}`);
        setAdsetsList([]);
        return;
      }

      console.log('Adsets loaded:', adsets);
      setAdsetsList(adsets || []);
      addConsoleMessage?.(`Loaded ${adsets?.length || 0} adsets`);
    } catch (error) {
      console.error('Error loading adsets:', error);
      addConsoleMessage?.(`Error loading adsets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAdsetsList([]);
    }
  };

  const toggleAdsetSelection = (adsetId: string) => {
    console.log('Toggle adset selection called for:', adsetId);
    setSelectedAdsets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adsetId)) {
        console.log('Removing adset:', adsetId);
        newSet.delete(adsetId);
      } else {
        console.log('Adding adset:', adsetId);
        newSet.add(adsetId);
      }
      console.log('New selection set:', Array.from(newSet));
      return newSet;
    });
  };

  const selectAllAdsets = () => {
    const allAdsetIds = adsetsList.map(adset => adset.id);
    setSelectedAdsets(new Set(allAdsetIds));
    addConsoleMessage?.(`Selected all ${allAdsetIds.length} adsets`);
  };

  const selectActiveAdsets = () => {
    const activeAdsetIds = adsetsList
      .filter(adset => adset.status === 'ACTIVE')
      .map(adset => adset.id);
    setSelectedAdsets(new Set(activeAdsetIds));
    addConsoleMessage?.(`Selected ${activeAdsetIds.length} active adsets`);
  };

  const handleFetchAdsForSelectedAdsets = async () => {
    if (selectedAdsets.size === 0) {
      addConsoleMessage?.('Error: Please select at least one adset');
      return;
    }

    setLoadingAdsForAdsets(true);
    setShowAdsSelectionPopup(false);
    addConsoleMessage?.(`Fetching ads for ${selectedAdsets.size} selected adsets...`);

    try {
      const adsetIds = Array.from(selectedAdsets);
      const response = await fetch(`/api/get_ads?adsetIds=${adsetIds.join(',')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Ads fetch response:', data);
      addConsoleMessage?.(`Ads fetch completed: ${JSON.stringify(data, null, 2)}`);

      await fetchTableData('ads');
      addConsoleMessage?.('Ads table refreshed after sync');
    } catch (error) {
      console.error('Error fetching ads:', error);
      addConsoleMessage?.(`Error fetching ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAdsForAdsets(false);
    }
  };

  const handleAbfrageAds = async (statusFilter: 'active' | 'all') => {
    setLoadingAdsAbfrage(true);
    setShowAdsetStatusPopup(false);
    addConsoleMessage?.(`Calling Netlify function for ads with status filter: ${statusFilter}...`);

    try {
      console.log(`Calling Netlify function for ads with status filter: ${statusFilter}...`);
      const response = await fetch(`/api/get_ads${statusFilter === 'active' ? '?statusFilter=active' : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);

      await fetchTableData('ads');
      addConsoleMessage?.('Ads table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAdsAbfrage(false);
    }
  };

  // Fetch ad accounts for dropdown
  useEffect(() => {
    const fetchAdAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_accounts')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching ad accounts:', error);
        } else {
          setAdAccounts(data || []);
          if (data && data.length > 0) {
            setSelectedAdAccountId(data[0].id.replace('act_', ''));
          }
        }
      } catch (err) {
        console.error('Exception fetching ad accounts:', err);
      }
    };

    fetchAdAccounts();
  }, []);

  // Handler for fetching customers from Lead-Table API to Kunden table
  const handleAbfrageKunden = async () => {
    setLoadingKundenAbfrage(true);
    addConsoleMessage?.('Calling Netlify function to sync Lead-Table customers to Kunden table...');

    try {
      console.log('Calling Netlify function to sync Lead-Table customers to Kunden table...');
      const response = await fetch('/api/get_customers_leadtable', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);

      // Refresh the Kunden table data after successful sync
      await fetchTableData('Kunden');
      addConsoleMessage?.('Kunden table refreshed after Lead-Table sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingKundenAbfrage(false);
    }
  };

  // Handler for fetching leadtable campaigns
  const handleAbfrageLeadtableCampaigns = async () => {
    setLoadingLeadtableCampaignsAbfrage(true);
    addConsoleMessage?.('Calling Netlify function for leadtable_campaigns...');

    try {
      console.log('Calling Netlify function for leadtable_campaigns...');
      const response = await fetch('/api/get_leadtable_campaigns', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);

      // Refresh the leadtable_campaigns table data after successful sync
      await fetchTableData('leadtable_campaigns');
      addConsoleMessage?.('Lead-Table campaigns refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingLeadtableCampaignsAbfrage(false);
    }
  };

  // Handler for fetching leadtable leads
  const handleOpenLeadsSelection = async () => {
    setShowLeadsSelectionPopup(true);

    try {
      const { data: customers, error } = await supabase
        .from('Kunden')
        .select('customer_id, customer_name, status')
        .order('customer_name', { ascending: true });

      if (error) {
        console.error('Error fetching customers:', error);
        addConsoleMessage?.(`Error fetching customers: ${error.message}`);
        setCustomersList([]);
        return;
      }

      console.log('Customers loaded:', customers);
      setCustomersList(customers || []);
      addConsoleMessage?.(`Loaded ${customers?.length || 0} customers`);
    } catch (error) {
      console.error('Error loading customers:', error);
      addConsoleMessage?.(`Error loading customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCustomersList([]);
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    console.log('Toggle customer selection called for:', customerId);
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        console.log('Removing customer:', customerId);
        newSet.delete(customerId);
      } else {
        console.log('Adding customer:', customerId);
        newSet.add(customerId);
      }
      console.log('New selection set:', Array.from(newSet));
      return newSet;
    });
  };

  const handleFetchLeadsForSelectedCustomers = async () => {
    if (selectedCustomers.size === 0) {
      addConsoleMessage?.('Error: Please select at least one customer');
      return;
    }

    setLoadingLeadsForCustomers(true);
    setShowLeadsSelectionPopup(false);
    addConsoleMessage?.(`Fetching leads for ${selectedCustomers.size} selected customers...`);

    try {
      const customerIds = Array.from(selectedCustomers);
      const response = await fetch(`/api/get_leadtable_campaign_leads?customerIds=${customerIds.join(',')}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Leads fetch response:', data);
      addConsoleMessage?.(`Leads fetch completed: ${JSON.stringify(data, null, 2)}`);

      await fetchTableData('leadtable_leads');
      addConsoleMessage?.('Lead-Table leads refreshed after sync');
    } catch (error) {
      console.error('Error fetching leads:', error);
      addConsoleMessage?.(`Error fetching leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingLeadsForCustomers(false);
    }
  };

  const handleAbfrageLeadtableLeads = async () => {
    setLoadingLeadtableLeadsAbfrage(true);
    addConsoleMessage?.('Calling Netlify function for leadtable_leads...');

    try {
      console.log('Calling Netlify function for leadtable_leads...');
      const response = await fetch('/api/get_leadtable_campaign_leads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);

      // Refresh the leadtable_leads table data after successful sync
      await fetchTableData('leadtable_leads');
      addConsoleMessage?.('Lead-Table leads refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingLeadtableLeadsAbfrage(false);
    }
  };

  // Handler for fetching creative images by hash
  const handleAbfrageCreativeImages = async () => {
    if (!selectedAdAccountId) {
      addConsoleMessage?.('Please select an ad account first');
      return;
    }

    setLoadingCreativeImagesAbfrage(true);
    setShowCreativeImagesPopup(false);
    addConsoleMessage?.(`Fetching creative images for ad account ${selectedAdAccountId}...`);

    try {
      console.log(`Calling fetch_creative_images function for ad account: ${selectedAdAccountId}...`);
      const response = await fetch('/api/fetch_creative_images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adAccountId: selectedAdAccountId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Fetch creative images response:', data);
      addConsoleMessage?.(`Fetch creative images completed: ${data.processed} creatives updated, ${data.errors} errors`);

      // Refresh the ad_creatives table data after successful fetch
      await fetchTableData('ad_creatives');
      addConsoleMessage?.('Ad creatives table refreshed after image fetch');
    } catch (error) {
      console.error('Error calling fetch_creative_images:', error);
      addConsoleMessage?.(`Error calling fetch_creative_images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingCreativeImagesAbfrage(false);
    }
  };

  // Standalone handler for ad creatives Abfrage
  const handleAbfrageCreatives = async (statusFilter: 'active' | 'all') => {
    setLoadingCreativesAbfrage(true);
    setShowCreativesStatusPopup(false);
    addConsoleMessage?.(`Calling Netlify function for ad creatives with status filter: ${statusFilter}...`);

    try {
      console.log(`Calling Netlify function for ad creatives with status filter: ${statusFilter}...`);
      const response = await fetch(`/api/get_ad_creatives${statusFilter === 'active' ? '?statusFilter=active' : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Netlify function response:', data);
      addConsoleMessage?.(`Netlify function response received: ${JSON.stringify(data, null, 2)}`);

      // Refresh the ad_creatives table data after successful sync
      await fetchTableData('ad_creatives');
      addConsoleMessage?.('Ad creatives table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingCreativesAbfrage(false);
    }
  };

  const toggleInsightsAdsetSelection = (adsetId: string) => {
    console.log('Toggle insights adset selection called for:', adsetId);
    setSelectedInsightsAdsets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adsetId)) {
        console.log('Removing adset:', adsetId);
        newSet.delete(adsetId);
      } else {
        console.log('Adding adset:', adsetId);
        newSet.add(adsetId);
      }
      console.log('New selection set:', Array.from(newSet));
      return newSet;
    });
  };

  const selectAllInsightsAdsets = () => {
    const allAdsetIds = insightsAdsetsList.map(adset => adset.id);
    setSelectedInsightsAdsets(new Set(allAdsetIds));
    addConsoleMessage?.(`Selected all ${allAdsetIds.length} adsets for insights`);
  };

  const selectActiveInsightsAdsets = () => {
    const activeAdsetIds = insightsAdsetsList
      .filter(adset => adset.status === 'ACTIVE')
      .map(adset => adset.id);
    setSelectedInsightsAdsets(new Set(activeAdsetIds));
    addConsoleMessage?.(`Selected ${activeAdsetIds.length} active adsets for insights`);
  };

  const initializeInsightsDates = async () => {
    setLoadingInsightsDateInit(true);
    addConsoleMessage?.('Initializing insights date range...');

    try {
      const { data: latestInsight, error: latestInsightError } = await supabase
        .from('ad_insights')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let defaultStartDate: string;
      if (latestInsight && latestInsight.date) {
        defaultStartDate = latestInsight.date;
        console.log(`Found latest date in ad_insights: ${defaultStartDate}`);
        addConsoleMessage?.(`Latest insight date: ${defaultStartDate}`);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];
        console.log(`No data found in ad_insights, using default: ${defaultStartDate}`);
        addConsoleMessage?.(`No existing data found, default start date: ${defaultStartDate}`);
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const defaultEndDate = yesterday.toISOString().split('T')[0];

      setInsightsStartDate(defaultStartDate);
      setInsightsEndDate(defaultEndDate);
      addConsoleMessage?.(`Date range initialized: ${defaultStartDate} to ${defaultEndDate}`);

      const { data: adsets, error: adsetsError } = await supabase
        .from('ad_sets')
        .select('id, name, status')
        .order('name', { ascending: true });

      if (adsetsError) {
        console.error('Error fetching adsets:', adsetsError);
        addConsoleMessage?.(`Error fetching adsets: ${adsetsError.message}`);
        setInsightsAdsetsList([]);
      } else {
        console.log('Insights adsets loaded:', adsets);
        setInsightsAdsetsList(adsets || []);
        addConsoleMessage?.(`Loaded ${adsets?.length || 0} adsets for insights`);
      }
    } catch (error) {
      console.error('Error initializing dates:', error);
      addConsoleMessage?.(`Error initializing dates: ${error instanceof Error ? error.message : 'Unknown error'}`);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setInsightsStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setInsightsEndDate(yesterday.toISOString().split('T')[0]);
    } finally {
      setLoadingInsightsDateInit(false);
    }
  };

  const handleAbfrageInsights = async () => {
    if (!insightsStartDate || !insightsEndDate) {
      addConsoleMessage?.('Error: Start date and end date are required');
      return;
    }

    if (new Date(insightsStartDate) > new Date(insightsEndDate)) {
      addConsoleMessage?.('Error: Start date cannot be after end date');
      return;
    }

    setLoadingInsightsAbfrage(true);
    setShowInsightsStatusPopup(false);

    const filterParts = [];
    if (selectedInsightsAdsets.size > 0) {
      filterParts.push(`${selectedInsightsAdsets.size} adsets`);
    }
    if (insightsStatusFilter === 'active') {
      filterParts.push('active');
    }
    const filterDesc = filterParts.length > 0 ? ` (${filterParts.join(', ')})` : '';

    addConsoleMessage?.(`Fetching insights from ${insightsStartDate} to ${insightsEndDate}${filterDesc}...`);

    try {
      const statusParam = insightsStatusFilter === 'active' ? '&statusFilter=active' : '';
      const adsetIdsParam = selectedInsightsAdsets.size > 0
        ? `&adsetIds=${Array.from(selectedInsightsAdsets).join(',')}`
        : '';

      const response = await fetch(
        `/api/get_ad_insights?startDate=${insightsStartDate}&endDate=${insightsEndDate}${statusParam}${adsetIdsParam}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Netlify function error:', errorText);
        addConsoleMessage?.(`Netlify function error: ${errorText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        addConsoleMessage?.(`Non-JSON response: ${responseText}`);
        return;
      }

      const data = await response.json();
      console.log('Ad insights response:', data);
      addConsoleMessage?.(`Insights fetch completed: ${data.supabaseSync?.processed || 0} items processed`);

      await fetchTableData('ad_insights');
      addConsoleMessage?.('Ad insights table refreshed after sync');
    } catch (error) {
      console.error('Error fetching insights:', error);
      addConsoleMessage?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingInsightsAbfrage(false);
    }
  };
  const refreshAllTables = async () => {
    // Clear all existing data and status
    setTableData({});
    setConnectionStatus({});
    setErrors({});
    
    // Reload status for all tables
    const promises = tables.map(tableName => fetchTableData(tableName));
    await Promise.all(promises);
  };

  // List of all tables from your database schema
  const tables = [
    'ad_targeting',
    'ad_insights',
    'Kunden',
    'customer_tasks',
    'changelog',
    'leadtable_campaigns',
    'leadtable_leads',
    'dashboard_users',
    'campaigns',
    'ad_accounts',
    'ad_sets',
    'ads',
    'ad_creatives'
  ];

  // Dedicated function to fetch table data
  const fetchTableData = async (tableName: string) => {
    setLoading(prev => ({ ...prev, [tableName]: true }));
    setErrors(prev => ({ ...prev, [tableName]: '' }));
    
    addConsoleMessage?.(`Fetching data for table: ${tableName}`);

    try {
      console.log(`Fetching data for table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      console.log(`Data for ${tableName}:`, data);
      console.log(`Error for ${tableName}:`, error);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        setErrors(prev => ({ ...prev, [tableName]: error.message }));
        setConnectionStatus(prev => ({ ...prev, [tableName]: 'error' }));
        addConsoleMessage?.(`Error fetching ${tableName}: ${error.message}`);
      } else {
        setTableData(prev => ({ ...prev, [tableName]: data || [] }));
        setConnectionStatus(prev => ({ ...prev, [tableName]: 'success' }));
        addConsoleMessage?.(`Successfully fetched ${(data || []).length} records from ${tableName}`);
      }
    } catch (err) {
      console.error(`Exception fetching ${tableName}:`, err);
      setErrors(prev => ({ 
        ...prev, 
        [tableName]: err instanceof Error ? err.message : 'Unknown error' 
      }));
      setConnectionStatus(prev => ({ ...prev, [tableName]: 'error' }));
      addConsoleMessage?.(`Exception fetching ${tableName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, [tableName]: false }));
    }
  };

  // Initial data loading on component mount
  useEffect(() => {
    const loadAllTableStatuses = async () => {
      addConsoleMessage?.('Loading all table statuses...');
      // Load status for all tables immediately
      const promises = tables.map(tableName => fetchTableData(tableName));
      await Promise.all(promises);
      addConsoleMessage?.('Finished loading all table statuses');
    };

    loadAllTableStatuses();
  }, []);

  const toggleTableExpansion = (tableName: string) => {
    const isExpanded = expandedTables.has(tableName);
    
    if (isExpanded) {
      // Collapse the table
      const newExpanded = new Set(expandedTables);
      newExpanded.delete(tableName);
      setExpandedTables(newExpanded);
    } else {
      // Expand the table and fetch data if not already fetched
      const newExpanded = new Set(expandedTables);
      newExpanded.add(tableName);
      setExpandedTables(newExpanded);
    }
  };

  const truncateText = (text: any, maxLength: number = 50): string => {
    if (text === null || text === undefined) return 'NULL';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück zum Dashboard</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supabase Datenbanken</h1>
              <p className="text-gray-600">Übersicht aller Tabellen und deren Inhalte</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={refreshAllTables}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Aktualisieren</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alle Tabellen</h2>
            <p className="text-sm text-gray-600 mt-1">Klicken Sie auf den Pfeil, um die ersten 5 Einträge anzuzeigen</p>
          </div>

          <div className="divide-y divide-gray-200">
            {tables.map((tableName) => (
              <div key={tableName}>
                {/* Table Header Row */}
                <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTableExpansion(tableName)}
                        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        {expandedTables.has(tableName) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Table className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-lg">{tableName}</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      {loading[tableName] && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                      {connectionStatus[tableName] === 'success' && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Verbunden</span>
                          {tableName === 'ad_accounts' && (
                            <button
                              onClick={handleAbfrageAdAccounts}
                              disabled={loadingAdAccountsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Ad Accounts von Meta API abrufen"
                            >
                              {loadingAdAccountsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'Kunden' && (
                            <button
                              onClick={handleAbfrageKunden}
                              disabled={loadingKundenAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Kunden von Lead-Table API abrufen"
                            >
                              {loadingKundenAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'leadtable_campaigns' && (
                            <button
                              onClick={handleAbfrageLeadtableCampaigns}
                              disabled={loadingLeadtableCampaignsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Lead-Table Campaigns für alle Kunden abrufen"
                            >
                              {loadingLeadtableCampaignsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'leadtable_leads' && (
                            <button
                              onClick={handleOpenLeadsSelection}
                              disabled={loadingLeadtableLeadsAbfrage || loadingLeadsForCustomers}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Lead-Table Leads für ausgewählte Kunden abrufen"
                            >
                              {(loadingLeadtableLeadsAbfrage || loadingLeadsForCustomers) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'campaigns' && (
                            <button
                              onClick={handleAbfrageCampaigns}
                              disabled={loadingCampaignsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Kampagnen von Meta API abrufen"
                            >
                              {loadingCampaignsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'ad_sets' && (
                            <button
                              onClick={handleAbfrageAdsets}
                              disabled={loadingAdsetsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Adsets von Meta API abrufen"
                            >
                              {loadingAdsetsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'ads' && (
                            <button
                              onClick={handleOpenAdsSelection}
                              disabled={loadingAdsAbfrage || loadingAdsForAdsets}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Ads von Meta API abrufen"
                            >
                              {(loadingAdsAbfrage || loadingAdsForAdsets) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'ad_creatives' && (
                            <>
                              <button
                                onClick={() => setShowCreativesStatusPopup(true)}
                                disabled={loadingCreativesAbfrage}
                                className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                                title="Ad Creatives von Meta API abrufen"
                              >
                                {loadingCreativesAbfrage ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                                ) : (
                                  <Search className="w-3 h-3" />
                                )}
                                <span>Abfrage</span>
                              </button>
                              <button
                                onClick={() => setShowCreativeImagesPopup(true)}
                                disabled={loadingCreativeImagesAbfrage}
                                className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors duration-150 disabled:opacity-50"
                                title="Creative Images von Meta API mit Hash abrufen"
                              >
                                {loadingCreativeImagesAbfrage ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-green-700"></div>
                                ) : (
                                  <Search className="w-3 h-3" />
                                )}
                                <span>Abfrage Creative</span>
                              </button>
                            </>
                          )}
                          {tableName === 'ad_insights' && (
                            <button
                              onClick={() => {
                                setShowInsightsStatusPopup(true);
                                initializeInsightsDates();
                              }}
                              disabled={loadingInsightsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Ad Insights von Meta API abrufen"
                            >
                              {loadingInsightsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                        </div>
                      )}
                      {connectionStatus[tableName] === 'error' && (
                        <div className="flex items-center space-x-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">Fehler</span>
                        </div>
                      )}
                      {!connectionStatus[tableName] && !loading[tableName] && (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTables.has(tableName) && (
                  <div className="px-6 pb-6 bg-gray-50">
                    {loading[tableName] ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Lade Daten...</span>
                      </div>
                    ) : errors[tableName] ? (
                      <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-800">
                          <strong>Fehler beim Laden der Daten:</strong> {errors[tableName]}
                        </div>
                      </div>
                    ) : tableData[tableName] && tableData[tableName].length > 0 ? (
                      <div className="mt-4">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  {Object.keys(tableData[tableName][0]).map((column) => (
                                    <th key={column} className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {tableData[tableName].map((row, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    {Object.entries(row).map(([column, value]) => (
                                      <td key={column} className="py-3 px-4 text-sm text-gray-900">
                                        <span title={formatValue(value)}>
                                          {truncateText(value)}
                                        </span>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Zeigt die ersten 5 Einträge von {tableName}
                        </div>
                      </div>
                    ) : tableData[tableName] && tableData[tableName].length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <Table className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Keine Daten in dieser Tabelle gefunden</p>
                        <p className="text-sm">Die Tabelle "{tableName}" ist leer</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Tabellen</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Adset Status Selection Popup */}
      {showAdsetStatusPopup && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAdsetStatusPopup(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-64 max-h-60 overflow-y-auto"
              style={{ backgroundColor: 'white' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={() => handleAbfrageAds('all')}
                  disabled={loadingAdsAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {loadingAdsAbfrage ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-700"></div>
                    ) : null}
                  </div>
                  <span className="text-gray-900">Alle Adsets</span>
                </button>
                <button
                  onClick={() => handleAbfrageAds('active')}
                  disabled={loadingAdsAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {loadingAdsAbfrage ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-700"></div>
                    ) : null}
                  </div>
                  <span className="text-gray-900">Nur aktive Adsets</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => setShowAdsetStatusPopup(false)}
                  disabled={loadingAdsAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center"></div>
                  <span className="text-gray-900">Abbrechen</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ad Creatives Status Selection Popup */}
      {showCreativesStatusPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreativesStatusPopup(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-64 max-h-60 overflow-y-auto"
              style={{ backgroundColor: 'white' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={() => handleAbfrageCreatives('all')}
                  disabled={loadingCreativesAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {loadingCreativesAbfrage ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-700"></div>
                    ) : null}
                  </div>
                  <span className="text-gray-900">Alle Ads</span>
                </button>
                <button
                  onClick={() => handleAbfrageCreatives('active')}
                  disabled={loadingCreativesAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {loadingCreativesAbfrage ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-700"></div>
                    ) : null}
                  </div>
                  <span className="text-gray-900">Nur aktive Ads</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => setShowCreativesStatusPopup(false)}
                  disabled={loadingCreativesAbfrage}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-4 h-4 flex items-center justify-center"></div>
                  <span className="text-gray-900">Abbrechen</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Creative Images Ad Account Selector Popup */}
      {showCreativeImagesPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreativeImagesPopup(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-6"
              style={{ minWidth: '300px', backgroundColor: 'white' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Ad Account</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Account
                </label>
                <select
                  value={selectedAdAccountId}
                  onChange={(e) => setSelectedAdAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'white' }}
                >
                  {adAccounts.map((account) => (
                    <option key={account.id} value={account.id.replace('act_', '')}>
                      {account.name} ({account.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAbfrageCreativeImages}
                  disabled={loadingCreativeImagesAbfrage || !selectedAdAccountId}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCreativeImagesAbfrage ? 'Loading...' : 'Fetch Images'}
                </button>
                <button
                  onClick={() => setShowCreativeImagesPopup(false)}
                  disabled={loadingCreativeImagesAbfrage}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ad Insights Date Range Picker Popup with Adset Selection */}
      {showInsightsStatusPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowInsightsStatusPopup(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'white' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6" style={{ backgroundColor: 'white' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ad Insights Zeitraum und Adsets wählen
                </h3>

                {loadingInsightsDateInit ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Lade Datumswerte...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="insights-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                          Startdatum
                        </label>
                        <input
                          id="insights-start-date"
                          type="date"
                          value={insightsStartDate}
                          onChange={(e) => setInsightsStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="insights-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                          Enddatum
                        </label>
                        <input
                          id="insights-end-date"
                          type="date"
                          value={insightsEndDate}
                          onChange={(e) => setInsightsEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Status
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setInsightsStatusFilter('all')}
                          className={`flex-1 px-4 py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                            insightsStatusFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {insightsStatusFilter === 'all' && <Check className="w-4 h-4" />}
                          <span>Alle Ads</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInsightsStatusFilter('active')}
                          className={`flex-1 px-4 py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                            insightsStatusFilter === 'active'
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {insightsStatusFilter === 'active' && <Check className="w-4 h-4" />}
                          <span>Nur aktive Ads</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adsets auswählen (optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Leer lassen für alle Adsets
                      </p>

                      {/* Quick Selection Buttons */}
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={selectAllInsightsAdsets}
                          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-150 font-medium text-sm"
                        >
                          Alle
                        </button>
                        <button
                          type="button"
                          onClick={selectActiveInsightsAdsets}
                          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-150 font-medium text-sm"
                        >
                          Nur Aktive
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInsightsAdsets(new Set())}
                          className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-150 font-medium text-sm"
                        >
                          Zurücksetzen
                        </button>
                      </div>

                      {/* Adset Selection List */}
                      <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                        {insightsAdsetsList.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Keine Adsets gefunden
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {insightsAdsetsList.map((adset) => (
                              <button
                                type="button"
                                key={adset.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleInsightsAdsetSelection(adset.id);
                                }}
                                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 text-left"
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                                    selectedInsightsAdsets.has(adset.id)
                                      ? 'bg-blue-600 border-blue-600'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedInsightsAdsets.has(adset.id) && (
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">{adset.name}</div>
                                </div>
                                {adset.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    adset.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {adset.status}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selection Summary */}
                      {selectedInsightsAdsets.size > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">
                            <strong>{selectedInsightsAdsets.size}</strong> Adset{selectedInsightsAdsets.size !== 1 ? 's' : ''} ausgewählt
                          </p>
                        </div>
                      )}
                    </div>

                    {insightsStartDate && insightsEndDate && new Date(insightsStartDate) > new Date(insightsEndDate) && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          Startdatum kann nicht nach dem Enddatum liegen.
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={handleAbfrageInsights}
                        disabled={
                          loadingInsightsAbfrage ||
                          !insightsStartDate ||
                          !insightsEndDate ||
                          new Date(insightsStartDate) > new Date(insightsEndDate)
                        }
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {loadingInsightsAbfrage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Lädt...</span>
                          </>
                        ) : (
                          <span>Abrufen</span>
                        )}
                      </button>
                      <button
                        onClick={() => setShowInsightsStatusPopup(false)}
                        disabled={loadingInsightsAbfrage}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Selection Popup for Leads */}
      {showLeadsSelectionPopup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowLeadsSelectionPopup(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" style={{ backgroundColor: 'white' }} onClick={(e) => e.stopPropagation()}>
              <div className="p-6" style={{ backgroundColor: 'white' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kunden auswählen
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Wählen Sie die Kunden aus, für die Sie Leads abrufen möchten.
                </p>

                {/* Customer Selection List */}
                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto mb-4">
                  {customersList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Keine Kunden gefunden
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {customersList.map((customer) => (
                        <button
                          type="button"
                          key={customer.customer_id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Customer clicked:', customer.customer_id);
                            toggleCustomerSelection(customer.customer_id);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 text-left"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                              selectedCustomers.has(customer.customer_id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedCustomers.has(customer.customer_id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="font-medium text-gray-900">{customer.customer_name}</div>
                          </div>
                          {customer.status && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              customer.status === 'Aktiv'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.status}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selection Summary */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedCustomers.size}</strong> Kunde{selectedCustomers.size !== 1 ? 'n' : ''} ausgewählt
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleFetchLeadsForSelectedCustomers}
                    disabled={selectedCustomers.size === 0 || loadingLeadsForCustomers}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loadingLeadsForCustomers ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Lädt...</span>
                      </>
                    ) : (
                      <span>Leads abrufen</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowLeadsSelectionPopup(false)}
                    disabled={loadingLeadsForCustomers}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Adset Selection Popup for Ads */}
      {showAdsSelectionPopup && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowAdsSelectionPopup(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" style={{ backgroundColor: 'white' }} onClick={(e) => e.stopPropagation()}>
              <div className="p-6" style={{ backgroundColor: 'white' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Adsets auswählen
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Wählen Sie die Adsets aus, für die Sie Ads abrufen möchten.
                </p>

                {/* Quick Selection Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAllAdsets}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-150 font-medium text-sm"
                  >
                    Alle
                  </button>
                  <button
                    onClick={selectActiveAdsets}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors duration-150 font-medium text-sm"
                  >
                    Nur Aktive
                  </button>
                </div>

                {/* Adset Selection List */}
                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto mb-4">
                  {adsetsList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Keine Adsets gefunden
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {adsetsList.map((adset) => (
                        <button
                          type="button"
                          key={adset.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Adset clicked:', adset.id);
                            toggleAdsetSelection(adset.id);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-150 text-left"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                              selectedAdsets.has(adset.id)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedAdsets.has(adset.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="font-medium text-gray-900">{adset.name}</div>
                          </div>
                          {adset.status && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              adset.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {adset.status}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selection Summary */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedAdsets.size}</strong> Adset{selectedAdsets.size !== 1 ? 's' : ''} ausgewählt
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleFetchAdsForSelectedAdsets}
                    disabled={selectedAdsets.size === 0 || loadingAdsForAdsets}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loadingAdsForAdsets ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Lädt...</span>
                      </>
                    ) : (
                      <span>Ads abrufen</span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAdsSelectionPopup(false)}
                    disabled={loadingAdsForAdsets}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};