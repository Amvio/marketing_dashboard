import React, { useState, useEffect } from 'react';
import { Target, Users, RefreshCw, Database, CreditCard as Edit3, X, Plus, ChevronDown, Check } from 'lucide-react';
import { supabase, Customer as SupabaseCustomer } from '../lib/supabase';
import { SimpleHeader } from './SimpleHeader';

interface SupabaseCustomerCampaignsPageProps {
  onBack: () => void;
  addConsoleMessage?: (message: string) => void;
}

interface CustomerCampaign {
  id: number;
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

export const SupabaseCustomerCampaignsPage: React.FC<SupabaseCustomerCampaignsPageProps> = ({ onBack, addConsoleMessage }) => {
  const [campaigns, setCampaigns] = useState<CustomerCampaign[]>([]);
  const [customers, setCustomers] = useState<SupabaseCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set());

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    
    addConsoleMessage('Fetching campaigns from campaigns table...');
    
    try {
      console.log('Fetching campaigns from campaigns table...');
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_time', { ascending: false });

      console.log('Campaigns data:', data);
      console.log('Campaigns error:', error);

      if (error) {
        console.error('Error fetching campaigns:', error);
        setError(error.message);
        addConsoleMessage?.(`Error fetching campaigns: ${error.message}`);
      } else {
        setCampaigns(data || []);
        addConsoleMessage?.(`Successfully fetched ${(data || []).length} campaigns`);
      }
    } catch (err) {
      console.error('Exception fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      addConsoleMessage?.(`Exception fetching campaigns: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    
    try {
      console.log('Fetching customers from Kunden table...');
      const { data, error } = await supabase
        .from('Kunden')
        .select('*')
        .order('customer_name', { ascending: true });

      console.log('Customers data:', data);
      console.log('Customers error:', error);

      if (error) {
        console.error('Error fetching customers:', error);
      } else {
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('Exception fetching customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCustomers();
  }, []);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('de-DE');
    } catch {
      return dateString;
    }
  };

  const formatBudget = (budget: number | null): string => {
    if (!budget) return '-';
    return `€${(budget / 100).toFixed(2)}`;
  };

  const handleCustomerAssignment = async (campaignId: number, customerId: number) => {
    console.log('Customer assignment clicked:', { campaignId, customerId });
    addConsoleMessage?.(`Customer assignment clicked: Campaign ${campaignId}, Customer ${customerId}`);
    
    // Close dropdown
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      newSet.delete(campaignId);
      return newSet;
    });
    
    try {
      console.log('Updating campaign in Supabase...', {
        campaignId,
        customerId: customerId === 0 ? null : customerId,
        table: 'campaigns',
        column: 'customer_id'
      });
      addConsoleMessage?.(`Updating campaign ${campaignId} with customer ${customerId === 0 ? 'null' : customerId}`);
      
      // Update the campaign in Supabase
      const { error } = await supabase
        .from('campaigns')
        .update({ customer_id: customerId === 0 ? null : customerId })
        .eq('id', campaignId);

      console.log('Supabase update result:', { error });

      if (error) {
        console.error('Error updating campaign customer assignment:', error);
        setError(`Fehler beim Zuweisen des Kunden: ${error.message}`);
        addConsoleMessage?.(`ERROR: Failed to update campaign: ${error.message}`);
        return;
      }

      console.log('Successfully updated campaign customer_id in database');
      addConsoleMessage?.(`SUCCESS: Updated campaign ${campaignId} customer_id in database`);
      
      // Update local state after successful database update
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, customer_id: customerId === 0 ? null : customerId }
          : campaign
      ));

      console.log('Local state updated successfully');
      addConsoleMessage?.('Local state updated successfully');
      
      // Clear any previous errors
      setError(null);
      
      // Optionally refresh campaigns from database to verify update
      await fetchCampaigns();
      
    } catch (err) {
      console.error('Exception updating customer assignment:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Zuweisen');
      addConsoleMessage?.(`EXCEPTION: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleDropdown = (campaignId: number) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const getAssignedCustomer = (customerId: number | null) => {
    if (!customerId) return null;
    return customers.find(customer => customer.customer_id === customerId);
  };

  // Column mapping for German headers
  const columnHeaders = {
    name: 'Kampagnenname',
    customer: 'Zugewiesener Kunde',
    status: 'Status',
    objective: 'Ziel',
    daily_budget: 'Tagesbudget',
    lifetime_budget: 'Gesamtbudget',
    start_time: 'Startdatum',
    end_time: 'Enddatum',
    created_time: 'Erstellt am'
  };

  // Console log for debugging - component render state
  console.log('SupabaseCustomerCampaignsPage render:', {
    campaignsCount: campaigns.length,
    customersCount: customers.length,
    loading,
    error,
    openDropdowns: Array.from(openDropdowns)
  });
  
  // Add render info to visible console
  React.useEffect(() => {
    addConsoleMessage?.(`Component render: ${campaigns.length} campaigns, ${customers.length} customers, loading: ${loading}`);
  }, [campaigns.length, customers.length, loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader onBackToDashboard={onBack} />

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kampagnen aus Supabase</h1>
                <p className="text-gray-600">Live-Daten aus der Kampagnen-Datenbank</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchCampaigns}
                disabled={loading}
                className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200 disabled:border-gray-300 disabled:text-gray-400"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Aktualisieren</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Main Campaigns Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Alle Kampagnen</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {loading ? 'Lade Daten...' : `${campaigns.length} Kampagnen gefunden`}
                  </p>
                </div>
                {error && (
                  <div className="text-red-600 text-sm">
                    Fehler: {error}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Lade Kampagnendaten...</span>
              </div>
            ) : error ? (
              <div className="py-12 px-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-red-800">
                    <strong>Fehler beim Laden der Kampagnendaten:</strong> {error}
                  </div>
                  <button
                    onClick={fetchCampaigns}
                    className="mt-3 text-red-600 hover:text-red-800 underline"
                  >
                    Erneut versuchen
                  </button>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Keine Kampagnen gefunden</p>
                <p className="text-sm">Die Kampagnen-Datenbank ist leer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.entries(columnHeaders).map(([key, header]) => (
                        <th key={key} className="text-left py-3 px-6 font-medium text-gray-700 whitespace-nowrap">
                          <span>{header}</span>
                        </th>
                      ))}
                      <th className="text-left py-3 px-6 font-medium text-gray-700 whitespace-nowrap">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {formatValue(campaign.name)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap" data-campaign-id={campaign.id}>
                          <div className="relative">
                            <button
                              onClick={() => toggleDropdown(campaign.id)}
                              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50 transition-colors min-w-48"
                              disabled={customersLoading}
                            >
                              <span className="flex-1 text-left truncate">
                                {customersLoading ? (
                                  'Lade Kunden...'
                                ) : (
                                  getAssignedCustomer(campaign.customer_id)?.customer_name || 'Kunde auswählen'
                                )}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            </button>
                            
                            {openDropdowns.has(campaign.id) && !customersLoading && (
                              <div 
                                className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto min-w-64"
                                style={{ 
                                  backgroundColor: 'white',
                                  top: `${Math.max(10, (document.querySelector(`[data-campaign-id="${campaign.id}"]`)?.getBoundingClientRect().bottom || 0) + 5)}px`,
                                  left: `${document.querySelector(`[data-campaign-id="${campaign.id}"]`)?.getBoundingClientRect().left || 0}px`
                                }}
                              >
                                <div className="p-2">
                                  <button
                                    onClick={() => handleCustomerAssignment(campaign.id, 0)}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded flex items-center justify-between transition-colors duration-150"
                                  >
                                    <span className="text-gray-500 italic">Keinen Kunden zuweisen</span>
                                    <div className="w-4 h-4 flex items-center justify-center">
                                      {!campaign.customer_id && <Check className="w-3 h-3 text-blue-600" />}
                                    </div>
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  {customers.map((customer) => (
                                    <button
                                      key={customer.customer_id}
                                      onClick={() => handleCustomerAssignment(campaign.id, customer.customer_id)}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded flex items-center justify-between transition-colors duration-150"
                                    >
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                          {customer.customer_name || customer.customer_company_name}
                                        </div>
                                        {customer.customer_name && customer.customer_company_name && (
                                          <div className="text-xs text-gray-500">
                                            {customer.customer_company_name}
                                          </div>
                                        )}
                                      </div>
                                      <div className="w-4 h-4 flex items-center justify-center">
                                        {campaign.customer_id === customer.customer_id && <Check className="w-3 h-3 text-blue-600" />}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {campaign.status ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              campaign.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : campaign.status === 'PAUSED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {campaign.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatValue(campaign.objective)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatBudget(campaign.daily_budget)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatBudget(campaign.lifetime_budget)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatDate(campaign.start_time)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatDate(campaign.end_time)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatDate(campaign.created_time)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded"
                            title="Kampagne bearbeiten"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 transition-colors p-1 rounded ml-2"
                            title="Kampagne löschen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};