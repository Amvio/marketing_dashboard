import React, { useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { SupabaseTablesPage } from './components/SupabaseTablesPage';
import { SupabaseCustomersPage } from './components/SupabaseCustomersPage';
import { SupabaseCustomerCampaignsPage } from './components/SupabaseCustomerCampaignsPage';
import { MetricCard } from './components/MetricCard';
import { LeadChart } from './components/LeadChart';
import { AdPerformanceTable } from './components/AdPerformanceTable';
import { TaskManager } from './components/TaskManager';
import { formatDateRange, getPreviousPeriodDateRange, getAggregatedMetricsForPeriod, generateDateRange, getDailyAggregatedChartData } from './utils/dateUtils';
import { Customer, Adset, Task, Campaign, Ad, AdInsight } from './types/dashboard';
import { MousePointer2, Eye, BarChart3, Users, ExternalLink, UserPlus, MessageSquare, CreditCard as Edit3, DollarSign, Target, TrendingUp, Printer } from 'lucide-react';

function getLast7Days() {
  // Calculate current week (Monday to Sunday)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to local midnight
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago + today = 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0); // Normalize to local midnight
    
    return { start: sevenDaysAgo, end: today };
}

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'supabase-tables' | 'supabase-customers' | 'supabase-campaigns'>('dashboard');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [selectedAdsetIds, setSelectedAdsetIds] = useState<string[]>([]);
  
  // Supabase data states
  const [supabaseCustomers, setSupabaseCustomers] = useState<Customer[]>([]);
  const [supabaseCampaigns, setSupabaseCampaigns] = useState<Campaign[]>([]);
  const [supabaseAdsets, setSupabaseAdsets] = useState<Adset[]>([]);
  const [supabaseAds, setSupabaseAds] = useState<Ad[]>([]);
  const [adInsights, setAdInsights] = useState<AdInsight[]>([]);
  const [adCreatives, setAdCreatives] = useState<any[]>([]);
  
  // Loading states
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingAdsets, setLoadingAdsets] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingCreatives, setLoadingCreatives] = useState(true);
  
  // Error states
  const [errorCustomers, setErrorCustomers] = useState<string | null>(null);
  const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);
  const [errorAdsets, setErrorAdsets] = useState<string | null>(null);
  const [errorAds, setErrorAds] = useState<string | null>(null);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);
  const [errorCreatives, setErrorCreatives] = useState<string | null>(null);
  
  // Date range state - initialize with last 7 days
  const { start: initialStartDate, end: initialEndDate } = getLast7Days();
  const [startDate, setStartDate] = useState<Date>(initialStartDate);
  const [endDate, setEndDate] = useState<Date>(initialEndDate);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Meta Ads Kampagne für Q4 optimieren',
      assignee: 'Max Müller',
      completed: false,
      createdAt: new Date('2025-01-15')
    },
    {
      id: '2',
      title: 'Neue Stellenanzeigen für Elektroniker erstellen',
      assignee: 'Anna Schmidt',
      completed: true,
      createdAt: new Date('2025-01-14')
    },
    {
      id: '3',
      title: 'Conversion-Rate der Karriereseite analysieren',
      assignee: 'Tom Weber',
      completed: false,
      createdAt: new Date('2025-01-13')
    }
  ]);

  // Calculate metrics data - moved before useState to avoid conditional hook calls
  const dateRangeString = formatDateRange(startDate, endDate);
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dailyDateRange = generateDateRange(startDate, endDate);
  
  // Calculate current and previous period metrics from actual database data
  const currentMetrics = getAggregatedMetricsForPeriod(
    adInsights,
    startDate,
    endDate,
    selectedCustomer,
    selectedCampaignIds,
    selectedAdsetIds,
    selectedAdIds,
    supabaseCampaigns
  );
  
  const previousPeriodRange = getPreviousPeriodDateRange(startDate, endDate);
  const previousMetrics = getAggregatedMetricsForPeriod(
    adInsights,
    previousPeriodRange.startDate,
    previousPeriodRange.endDate,
    selectedCustomer,
    selectedCampaignIds,
    selectedAdsetIds,
    selectedAdIds,
    supabaseCampaigns
  );

  const [metricsData, setMetricsData] = useState(() => [
    {
      id: 'impressions',
      title: 'Impressionen',
      value: currentMetrics.impressions,
      previousValue: previousMetrics.impressions,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-primary-blue',
      icon: <Eye className="w-4 h-4" />
    },
    {
      id: 'clicks',
      title: 'Klicks',
      value: currentMetrics.clicks,
      previousValue: previousMetrics.clicks,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-secondary-blue',
      icon: <MousePointer2 className="w-4 h-4" />
    },
    {
      id: 'spend',
      title: 'Ausgaben',
      value: Math.round(currentMetrics.spend * 100) / 100, // Round to 2 decimal places
      previousValue: Math.round(previousMetrics.spend * 100) / 100,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-tertiary-blue',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      id: 'reach',
      title: 'Reichweite',
      value: currentMetrics.reach,
      previousValue: previousMetrics.reach,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-primary-blue',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'ctr',
      title: 'CTR (%)',
      value: Math.round(currentMetrics.ctr * 100) / 100, // Round to 2 decimal places
      previousValue: Math.round(previousMetrics.ctr * 100) / 100,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-secondary-blue',
      icon: <Target className="w-4 h-4" />
    },
    {
      id: 'cpm',
      title: 'CPM (€)',
      value: Math.round(currentMetrics.cpm * 100) / 100, // Round to 2 decimal places
      previousValue: Math.round(previousMetrics.cpm * 100) / 100,
      chartData: dailyDateRange.map(() => 0),
      color: 'bg-tertiary-blue',
      icon: <TrendingUp className="w-4 h-4" />
    }
  ]);

  // Fetch customers from Supabase
  React.useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      setErrorCustomers(null);
      
      try {
        const { data, error } = await supabase
          .from('Kunden')
          .select('*')
          .order('customer_created_at', { ascending: false });

        if (error) {
          console.error('Error fetching customers:', error);
          setErrorCustomers(error.message);
        } else {
          setSupabaseCustomers(data || []);
          // Set first customer as selected if none selected
          if (!selectedCustomer && data && data.length > 0) {
            setSelectedCustomer(data[0]);
          }
        }
      } catch (err) {
        console.error('Exception fetching customers:', err);
        setErrorCustomers(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch campaigns from Supabase
  React.useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      setErrorCampaigns(null);
      
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_time', { ascending: false });

        if (error) {
          console.error('Error fetching campaigns:', error);
          setErrorCampaigns(error.message);
        } else {
          setSupabaseCampaigns(data || []);
        }
      } catch (err) {
        console.error('Exception fetching campaigns:', err);
        setErrorCampaigns(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch adsets from Supabase
  React.useEffect(() => {
    const fetchAdsets = async () => {
      setLoadingAdsets(true);
      setErrorAdsets(null);
      
      try {
        const { data, error } = await supabase
          .from('ad_sets')
          .select('*')
          .order('created_time', { ascending: false });

        if (error) {
          console.error('Error fetching adsets:', error);
          setErrorAdsets(error.message);
        } else {
          setSupabaseAdsets(data || []);
        }
      } catch (err) {
        console.error('Exception fetching adsets:', err);
        setErrorAdsets(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingAdsets(false);
      }
    };

    fetchAdsets();
  }, []);

  // Fetch ads from Supabase
  React.useEffect(() => {
    const fetchAds = async () => {
      setLoadingAds(true);
      setErrorAds(null);
      
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .order('created_time', { ascending: false });

        if (error) {
          console.error('Error fetching ads:', error);
          setErrorAds(error.message);
        } else {
          setSupabaseAds(data || []);
        }
      } catch (err) {
        console.error('Exception fetching ads:', err);
        setErrorAds(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingAds(false);
      }
    };

    fetchAds();
  }, []);

  // Fetch ad insights from Supabase
  React.useEffect(() => {
    const fetchAdInsights = async () => {
      setLoadingInsights(true);
      setErrorInsights(null);
      
      try {
        console.log('Fetching ad insights from ad_insights table...');
        const { data, error } = await supabase
          .from('ad_insights')
          .select('*')
          .order('date', { ascending: false });

        console.log('Ad insights data:', data);
        console.log('Ad insights error:', error);

        if (error) {
          console.error('Error fetching ad insights:', error);
          setErrorInsights(error.message);
        } else {
          setAdInsights(data || []);
        }
      } catch (err) {
        console.error('Exception fetching ad insights:', err);
        setErrorInsights(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingInsights(false);
      }
    };

    fetchAdInsights();
  }, []);

  // Fetch ad creatives from Supabase
  React.useEffect(() => {
    const fetchAdCreatives = async () => {
      setLoadingCreatives(true);
      setErrorCreatives(null);
      
      try {
        console.log('Fetching ad creatives from ad_creatives table...');
        const { data, error } = await supabase
          .from('ad_creatives')
          .select('*')
          .order('created_time', { ascending: false });

        console.log('Ad creatives data:', data);
        console.log('Ad creatives error:', error);

        if (error) {
          console.error('Error fetching ad creatives:', error);
          setErrorCreatives(error.message);
        } else {
          setAdCreatives(data || []);
        }
      } catch (err) {
        console.error('Exception fetching ad creatives:', err);
        setErrorCreatives(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoadingCreatives(false);
      }
    };

    fetchAdCreatives();
  }, []);

  // Update metrics data when customer changes
  React.useEffect(() => {
    const updatedCurrentMetrics = getAggregatedMetricsForPeriod(
      adInsights,
      startDate,
      endDate,
      selectedCustomer,
      selectedCampaignIds,
      selectedAdsetIds,
      selectedAdIds,
      supabaseCampaigns
    );
    
    const updatedPreviousPeriodRange = getPreviousPeriodDateRange(startDate, endDate);
    const updatedPreviousMetrics = getAggregatedMetricsForPeriod(
      adInsights,
      updatedPreviousPeriodRange.startDate,
      updatedPreviousPeriodRange.endDate,
      selectedCustomer,
      selectedCampaignIds,
      selectedAdsetIds,
      selectedAdIds,
      supabaseCampaigns
    );
    
    const updatedDailyDateRange = generateDateRange(startDate, endDate);
    
    // Get daily aggregated chart data from ad_insights
    const dailyChartData = getDailyAggregatedChartData(
      adInsights,
      updatedDailyDateRange,
      selectedCustomer,
      selectedCampaignIds,
      selectedAdsetIds,
      selectedAdIds,
      supabaseCampaigns
    );
    
    setMetricsData([
      {
        id: 'impressions',
        title: 'Impressionen',
        value: updatedCurrentMetrics.impressions,
        previousValue: updatedPreviousMetrics.impressions,
        chartData: dailyChartData.map(d => d.impressions),
        color: 'bg-primary-blue',
        icon: <Eye className="w-4 h-4" />
      },
      {
        id: 'clicks',
        title: 'Klicks',
        value: updatedCurrentMetrics.clicks,
        previousValue: updatedPreviousMetrics.clicks,
        chartData: dailyChartData.map(d => d.clicks),
        color: 'bg-secondary-blue',
        icon: <MousePointer2 className="w-4 h-4" />
      },
      {
        id: 'spend',
        title: 'Ausgaben',
        value: Math.round(updatedCurrentMetrics.spend * 100) / 100,
        previousValue: Math.round(updatedPreviousMetrics.spend * 100) / 100,
        chartData: dailyChartData.map(d => Math.round(d.spend * 100) / 100),
        color: 'bg-tertiary-blue',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        id: 'reach',
        title: 'Reichweite',
        value: updatedCurrentMetrics.reach,
        previousValue: updatedPreviousMetrics.reach,
        chartData: dailyChartData.map(d => d.reach),
        color: 'bg-primary-blue',
        icon: <Users className="w-4 h-4" />
      },
      {
        id: 'ctr',
        title: 'CTR (%)',
        value: Math.round(updatedCurrentMetrics.ctr * 100) / 100,
        previousValue: Math.round(updatedPreviousMetrics.ctr * 100) / 100,
        chartData: dailyChartData.map(d => Math.round(d.ctr * 100) / 100),
        color: 'bg-secondary-blue',
        icon: <Target className="w-4 h-4" />
      },
      {
        id: 'cpm',
        title: 'CPM (€)',
        value: Math.round(updatedCurrentMetrics.cpm * 100) / 100,
        previousValue: Math.round(updatedPreviousMetrics.cpm * 100) / 100,
        chartData: dailyChartData.map(d => Math.round(d.cpm * 100) / 100),
        color: 'bg-tertiary-blue',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ]);
  }, [selectedCustomer, selectedCampaignIds, selectedAdsetIds, selectedAdIds, startDate, endDate, adInsights, supabaseCampaigns]);

  // Early return for loading state - moved after all hooks
  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Kundendaten...</p>
          {errorCustomers && (
            <p className="text-red-600 mt-2">Fehler: {errorCustomers}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Filter campaigns by selected customer
  const filteredCampaigns = supabaseCampaigns.filter(campaign => 
    selectedCustomer ? campaign.customer_id === selectedCustomer.customer_id : false
  );
  
  // Use selected campaigns if any are selected, otherwise use all filtered campaigns
  const selectedCampaigns = selectedCampaignIds.length > 0
    ? filteredCampaigns.filter(campaign => selectedCampaignIds.includes(campaign.id.toString()))
    : filteredCampaigns;
  
  // Filter adsets by selected campaigns
  const filteredAdsets = supabaseAdsets.filter(adset => 
    selectedCampaigns.some(campaign => campaign.id === adset.campaign_id)
  );
  
  // Use selected adsets if any are selected, otherwise use all filtered adsets
  const selectedAdsets = selectedAdsetIds.length > 0
    ? filteredAdsets.filter(adset => selectedAdsetIds.includes(adset.id.toString()))
    : filteredAdsets;
  
  // Filter ads by selected adsets
  const filteredAds = supabaseAds.filter(ad => 
    selectedAdsets.some(adset => adset.id === ad.ad_set_id)
  );

  // Generate chart data based on selected date range using daily aggregated data
  const currentChartData = getDailyAggregatedChartData(
    adInsights,
    dailyDateRange,
    selectedCustomer,
    selectedCampaignIds,
    selectedAdsetIds,
    selectedAdIds,
    supabaseCampaigns
  );

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleCustomerChange = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Reset all dependent selections when customer changes to maintain hierarchy
    setSelectedCampaignIds([]);
    setSelectedAdIds([]);
    setSelectedAdsetIds([]);
  };

  const handleCampaignChange = (campaignIds: string[]) => {
    setSelectedCampaignIds(campaignIds);
    // Reset dependent selections when campaign changes to maintain hierarchy
    setSelectedAdIds([]);
    setSelectedAdsetIds([]);
  };

  const handleAdsetChange = (adsetIds: string[]) => {
    setSelectedAdsetIds(adsetIds);
    // Reset dependent selections when adset changes to maintain hierarchy
    setSelectedAdIds([]);
  };

  const handleAdChange = (adIds: string[]) => {
    setSelectedAdIds(adIds);
  };

  const handleAddTask = (title: string, assignee: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      assignee,
      completed: false,
      createdAt: new Date()
    };
    setTasks([newTask, ...tasks]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleNavigateToCustomers = () => {
    setCurrentPage('supabase-customers');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToSupabaseTables = () => {
    setCurrentPage('supabase-tables');
  };

  const handleNavigateToSupabaseCustomers = () => {
    setCurrentPage('supabase-customers');
  };

  const handleNavigateToSupabaseCampaigns = () => {
    setCurrentPage('supabase-campaigns');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newMetricsData = [...metricsData];
    const draggedItem = newMetricsData[draggedIndex];
    
    // Remove the dragged item
    newMetricsData.splice(draggedIndex, 1);
    
    // Insert at the new position
    newMetricsData.splice(dropIndex, 0, draggedItem);
    
    setMetricsData(newMetricsData);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePrintDashboard = () => {
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode');
    }, 500);
  };

  // Show customers page if selected
  if (currentPage === 'supabase-tables') {
    return (
      <>
        <Navbar 
          onNavigateToDashboard={handleNavigateToDashboard}
          onNavigateToCustomers={handleNavigateToCustomers}
          onNavigateToSupabaseTables={handleNavigateToSupabaseTables}
        />
        <SupabaseTablesPage onBack={handleBackToDashboard} />
      </>
    );
  }

  // Show Supabase customers page if selected
  if (currentPage === 'supabase-customers') {
    return (
      <>
        <Navbar 
          onNavigateToDashboard={handleNavigateToDashboard}
          onNavigateToCustomers={handleNavigateToCustomers}
          onNavigateToSupabaseTables={handleNavigateToSupabaseTables}
          onNavigateToSupabaseCustomers={handleNavigateToSupabaseCustomers}
          onNavigateToSupabaseCampaigns={handleNavigateToSupabaseCampaigns}
          onExport={handlePrintDashboard}
        />
        <SupabaseCustomersPage onBack={handleBackToDashboard} />
      </>
    );
  }

  // Show Supabase campaigns page if selected
  if (currentPage === 'supabase-campaigns') {
    return (
      <>
        <Navbar 
          onNavigateToDashboard={handleNavigateToDashboard}
          onNavigateToCustomers={handleNavigateToCustomers}
          onNavigateToSupabaseTables={handleNavigateToSupabaseTables}
          onNavigateToSupabaseCustomers={handleNavigateToSupabaseCustomers}
          onNavigateToSupabaseCampaigns={handleNavigateToSupabaseCampaigns}
          onExport={handlePrintDashboard}
        />
        <SupabaseCustomerCampaignsPage onBack={handleBackToDashboard} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onNavigateToDashboard={handleNavigateToDashboard}
        onNavigateToCustomers={handleNavigateToCustomers}
        onNavigateToSupabaseTables={handleNavigateToSupabaseTables}
        onNavigateToSupabaseCustomers={handleNavigateToSupabaseCustomers}
        onNavigateToSupabaseCampaigns={handleNavigateToSupabaseCampaigns}
        onExport={handlePrintDashboard}
      />
      <Header
        customers={supabaseCustomers}
        selectedCustomer={selectedCustomer}
        onCustomerChange={handleCustomerChange}
        campaigns={filteredCampaigns}
        selectedCampaignIds={selectedCampaignIds}
        onCampaignChange={handleCampaignChange}
        ads={filteredAds}
        selectedAdIds={selectedAdIds}
        onAdChange={handleAdChange}
        adsets={filteredAdsets}
        selectedAdsetIds={selectedAdsetIds}
        onAdsetChange={handleAdsetChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        dateRangeString={dateRangeString}
        onNavigateToCustomers={handleNavigateToCustomers}
      />
      
      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-6 gap-6">
          {metricsData.map((metric, index) => (
            <div
              key={metric.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-all duration-300 ease-in-out ${
                draggedIndex === index 
                  ? 'opacity-30 scale-110 rotate-2 z-50' 
                  : dragOverIndex === index
                  ? 'scale-105 translate-x-2 shadow-lg'
                  : 'hover:scale-102 hover:shadow-md'
              }`}
              style={{
                transform: dragOverIndex !== null && dragOverIndex < index && draggedIndex !== null && draggedIndex > index
                  ? 'translateX(8px)'
                  : dragOverIndex !== null && dragOverIndex > index && draggedIndex !== null && draggedIndex < index
                  ? 'translateX(-8px)'
                  : undefined
              }}
            >
              <MetricCard
                title={metric.title}
                value={metric.value}
                previousValue={metric.previousValue}
                chartData={metric.chartData}
                color={metric.color}
                icon={metric.icon}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          ))}
        </div>
        
        {/* Lead Chart */}
        <div className="grid grid-cols-1 gap-6">
          <LeadChart 
            data={currentChartData} 
            metricsData={metricsData.map(m => ({
              id: m.id,
              title: m.title,
              value: m.value,
              chartData: m.chartData
            }))}
          />
        </div>
        
        {/* Ad Performance Table */}
        <div className="grid grid-cols-1 gap-6">
          <AdPerformanceTable 
            ads={supabaseAds}
            adInsights={adInsights}
            adCreatives={adCreatives}
            selectedCustomer={selectedCustomer}
            selectedCampaignIds={selectedCampaignIds}
            selectedAdsetIds={selectedAdsetIds}
            selectedAdIds={selectedAdIds}
            campaigns={supabaseCampaigns}
            adsets={supabaseAdsets}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
        
        {/* Task Manager */}
        <div className="grid grid-cols-1 gap-6">
          <TaskManager
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
        
        {/* Print Button */}
      </div>
    </div>
  );
}

export default App;