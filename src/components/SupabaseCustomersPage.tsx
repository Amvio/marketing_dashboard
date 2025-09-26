import React, { useState, useEffect } from 'react';
import { Building2, Users, Mail, Phone, MapPin, Globe, Calendar, RefreshCw, Database, Edit3, X } from 'lucide-react';
import { supabase, Customer as SupabaseCustomer } from '../lib/supabase';
import { SimpleHeader } from './SimpleHeader';
import { AddCustomerForm, CustomerFormData } from './AddCustomerForm';

interface SupabaseCustomersPageProps {
  onBack: () => void;
}

interface CustomerCampaign {
  customer_name: string | null;
  campaign_id: number;
}

export const SupabaseCustomersPage: React.FC<SupabaseCustomersPageProps> = ({ onBack }) => {
  const [customers, setCustomers] = useState<SupabaseCustomer[]>([]);
  const [customerCampaigns, setCustomerCampaigns] = useState<CustomerCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<SupabaseCustomer | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<SupabaseCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomerCampaigns = async () => {
    setCampaignLoading(true);
    setCampaignError(null);
    
    try {
      console.log('Fetching campaigns with ad_account relationships...');
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          ad_account_id
        `)
        .order('id', { ascending: true });

      console.log('Campaign data:', campaignData);
      console.log('Campaign error:', campaignError);

      if (campaignError) {
        console.error('Error fetching campaigns:', campaignError);
        setCampaignError(campaignError.message);
      } else {
        // Create relationships by matching ad_account_id with customer_id
        // This assumes ad_account_id corresponds to customer_id
        const relationships: CustomerCampaign[] = (campaignData || []).map((campaign) => {
          const matchingCustomer = customers.find(customer => 
            customer.customer_id === campaign.ad_account_id
          );
          
          return {
            customer_name: matchingCustomer?.customer_name || `Unbekannter Kunde (ID: ${campaign.ad_account_id})`,
            campaign_id: campaign.id
          };
        });
        
        // Filter out campaigns without matching customers if you want to show only orphaned ones
        // const orphanedCampaigns = relationships.filter(rel => rel.customer_name.startsWith('Unbekannter Kunde'));
        
        setCustomerCampaigns(relationships);
      }
    } catch (err) {
      console.error('Exception fetching campaigns:', err);
      setCampaignError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCampaignLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching customers from Kunden table...');
      const { data, error } = await supabase
        .from('Kunden')
        .select('*')
        .order('customer_created_at', { ascending: false });

      console.log('Customers data:', data);
      console.log('Customers error:', error);

      if (error) {
        console.error('Error fetching customers:', error);
        setError(error.message);
      } else {
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('Exception fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      fetchCustomerCampaigns();
    }
  }, [customers]);

  useEffect(() => {
    if (customers.length > 0) {
      fetchCustomerCampaigns();
    }
  }, [customers]);

  const handleAddCustomer = async (customerData: CustomerFormData, customerId?: number) => {
    setIsSubmitting(true);
    
    try {
      console.log(customerId ? 'Updating customer:' : 'Adding new customer:', customerData);
      
      let logoUrl = null;
      
      // Upload logo if provided
      if (customerData.logoFile) {
        const fileExt = customerData.logoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `customer-logos/${fileName}`;
        
        console.log('Uploading logo:', filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('customer_logos')
          .upload(filePath, customerData.logoFile);
        
        if (uploadError) {
          console.error('Error uploading logo:', uploadError);
          setError(`Fehler beim Hochladen des Logos: ${uploadError.message}`);
          return;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('customer_logos')
          .getPublicUrl(filePath);
        
        logoUrl = urlData.publicUrl;
        console.log('Logo uploaded successfully:', logoUrl);
      }
      
      // Prepare customer data without logoFile
      const { logoFile, ...customerDataWithoutFile } = customerData;
      const finalCustomerData = {
        ...customerDataWithoutFile,
        ...(logoUrl && { logo_url: logoUrl })
      };
      
      let data, error;
      
      if (customerId) {
        // Update existing customer
        const result = await supabase
          .from('Kunden')
          .update(finalCustomerData)
          .eq('customer_id', customerId)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // Insert new customer
        const result = await supabase
          .from('Kunden')
          .insert([finalCustomerData])
          .select();
        data = result.data;
        error = result.error;
      }

      console.log(customerId ? 'Update result:' : 'Insert result:', { data, error });

      if (error) {
        console.error(customerId ? 'Error updating customer:' : 'Error adding customer:', error);
        setError(`Fehler beim ${customerId ? 'Aktualisieren' : 'Hinzufügen'} des Kunden: ${error.message}`);
      } else {
        console.log(customerId ? 'Customer updated successfully:' : 'Customer added successfully:', data);
        setShowAddForm(false);
        setShowEditForm(false);
        setEditingCustomer(null);
        // Refresh the customer list
        await fetchCustomers();
        // Clear any previous errors
        setError(null);
      }
    } catch (err) {
      console.error('Exception adding customer:', err);
      setError(err instanceof Error ? err.message : `Unbekannter Fehler beim ${customerId ? 'Aktualisieren' : 'Hinzufügen'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingCustomer(null);
    setError(null);
  };

  const handleEditClick = (customer: SupabaseCustomer) => {
    setEditingCustomer(customer);
    setShowEditForm(true);
    setError(null);
  };

  const handleDeleteClick = (customer: SupabaseCustomer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    setIsDeleting(true);
    
    try {
      console.log('Deleting customer:', customerToDelete.customer_id);
      
      const { error } = await supabase
        .from('Kunden')
        .delete()
        .eq('customer_id', customerToDelete.customer_id);

      if (error) {
        console.error('Error deleting customer:', error);
        setError(`Fehler beim Löschen des Kunden: ${error.message}`);
      } else {
        console.log('Customer deleted successfully');
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
        // Refresh the customer list
        await fetchCustomers();
        // Clear any previous errors
        setError(null);
      }
    } catch (err) {
      console.error('Exception deleting customer:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Löschen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCustomerToDelete(null);
    setError(null);
  };

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

  // Column mapping for German headers
  const columnHeaders = {
    customer_name: 'Kundenname',
    customer_company_name: 'Firmenname',
    customer_branch: 'Branche',
    customer_contact_person: 'Ansprechpartner',
    contact_email: 'E-Mail',
    customer_contact_phone: 'Telefonnummer',
    customer_adress: 'Adresse',
    customer_website: 'Webseite',
    logo_url: 'Logo',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader onBackToDashboard={onBack} />

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kunden aus Supabase</h1>
                <p className="text-gray-600">Live-Daten aus der Kunden-Datenbank</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchCustomers}
                disabled={loading}
                className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200 disabled:border-gray-300 disabled:text-gray-400"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Aktualisieren</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Hinzufügen</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Main Customer Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alle Kunden</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? 'Lade Daten...' : `${customers.length} Kunden gefunden`}
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
              <span className="ml-3 text-gray-600">Lade Kundendaten...</span>
            </div>
          ) : error ? (
            <div className="py-12 px-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800">
                  <strong>Fehler beim Laden der Kundendaten:</strong> {error}
                </div>
                <button
                  onClick={fetchCustomers}
                  className="mt-3 text-red-600 hover:text-red-800 underline"
                >
                  Erneut versuchen
                </button>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Kunden gefunden</p>
              <p className="text-sm">Die Kunden-Datenbank ist leer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.entries(columnHeaders).map(([key, header]) => (
                      <th key={key} className="text-left py-3 px-6 font-medium text-gray-700 whitespace-nowrap">
                        {header === 'E-Mail' && <Mail className="w-4 h-4 inline mr-1" />}
                        {header === 'Telefonnummer' && <Phone className="w-4 h-4 inline mr-1" />}
                        {header === 'Adresse' && <MapPin className="w-4 h-4 inline mr-1" />}
                        {header === 'Webseite' && <Globe className="w-4 h-4 inline mr-1" />}
                        <span>{header}</span>
                      </th>
                    ))}
                    <th className="text-left py-3 px-6 font-medium text-gray-700 whitespace-nowrap">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatValue(customer.customer_name)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatValue(customer.customer_company_name)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatValue(customer.customer_branch)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatValue(customer.customer_contact_person)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {customer.contact_email ? (
                          <a 
                            href={`mailto:${customer.contact_email}`} 
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {customer.contact_email}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {customer.customer_contact_phone ? (
                          <a 
                            href={`tel:${customer.customer_contact_phone}`} 
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {customer.customer_contact_phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-900 whitespace-nowrap">
                        {formatValue(customer.customer_adress)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {customer.customer_website ? (
                          <a 
                            href={customer.customer_website.startsWith('http') ? customer.customer_website : `https://${customer.customer_website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {customer.customer_website}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {customer.logo_url ? (
                          <img
                            src={customer.logo_url}
                            alt={`${customer.customer_name} Logo`}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(customer)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded"
                          title="Kunde bearbeiten"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 rounded ml-2"
                          title="Kunde löschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>

          {/* Customer-Campaign Relationship Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Summary Cards */}
          </div>
        </div>
      </div>

      {/* Add Customer Form Modal */}
      {(showAddForm || showEditForm) && (
        <AddCustomerForm
          onSubmit={(data) => handleAddCustomer(data, editingCustomer?.customer_id)}
          onCancel={handleCancelAdd}
          isSubmitting={isSubmitting}
          initialData={editingCustomer ? {
            customer_name: editingCustomer.customer_name || '',
            customer_company_name: editingCustomer.customer_company_name || '',
            customer_branch: editingCustomer.customer_branch || '',
            customer_contact_person: editingCustomer.customer_contact_person || '',
            contact_email: editingCustomer.contact_email || '',
            customer_contact_phone: editingCustomer.customer_contact_phone || '',
            customer_adress: editingCustomer.customer_adress || '',
            customer_website: editingCustomer.customer_website || '',
            logoFile: null
          } : undefined}
          isEditing={showEditForm}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleDeleteCancel}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'transparent' }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'white' }}>
              {/* Header */}
              <div className="p-6 border-b border-gray-200" style={{ backgroundColor: 'white' }}>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bist du sicher?
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Das ist unwiderruflich.
                </p>
              </div>

              {/* Content */}
              <div className="p-6" style={{ backgroundColor: 'white' }}>
                <p className="text-gray-700">
                  Möchten Sie den Kunden <strong>{customerToDelete.customer_name || customerToDelete.customer_company_name}</strong> wirklich löschen?
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200" style={{ backgroundColor: 'white' }}>
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-red-400"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  <span>
                    {isDeleting ? 'Löschen...' : 'Bestätigen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};