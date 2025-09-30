import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, ArrowLeft, Table, Eye, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react';
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
  const [showAdsetStatusPopup, setShowAdsetStatusPopup] = useState(false);
  const [showCreativesStatusPopup, setShowCreativesStatusPopup] = useState(false);

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

  // Standalone handler for ads Abfrage
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
      
      // Refresh the ads table data after successful sync
      await fetchTableData('ads');
      addConsoleMessage?.('Ads table refreshed after sync');
    } catch (error) {
      console.error('Error calling Netlify function:', error);
      addConsoleMessage?.(`Error calling Netlify function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingAdsAbfrage(false);
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
                              onClick={() => setShowAdsetStatusPopup(true)}
                              disabled={loadingAdsAbfrage}
                              className="ml-2 flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors duration-150 disabled:opacity-50"
                              title="Ads von Meta API abrufen"
                            >
                              {loadingAdsAbfrage ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-700"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                              <span>Abfrage</span>
                            </button>
                          )}
                          {tableName === 'ad_creatives' && (
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
    </div>
  );
};