import React from 'react';
import { Calendar, ChevronDown, Share2, Settings, Users, Target, Check } from 'lucide-react';
import { Customer, Adset, Campaign, Ad } from '../types/dashboard';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface HeaderProps {
  customers: Customer[];
  selectedCustomer: Customer;
  onCustomerChange: (customer: Customer) => void;
  campaigns: Campaign[];
  selectedCampaignIds: string[];
  onCampaignChange: (campaignIds: string[]) => void;
  ads: Ad[];
  selectedAdIds: string[];
  onAdChange: (adIds: string[]) => void;
  adsets: Adset[];
  selectedAdsetIds: string[];
  onAdsetChange: (adsetIds: string[]) => void;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  dateRangeString: string;
  onNavigateToCustomers: () => void;
  sichtbarkeit: string;
  onSichtbarkeitChange: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  customers,
  selectedCustomer,
  onCustomerChange,
  campaigns,
  selectedCampaignIds,
  onCampaignChange,
  ads,
  selectedAdIds,
  onAdChange,
  adsets,
  selectedAdsetIds,
  onAdsetChange,
  startDate,
  endDate,
  onDateRangeChange,
  dateRangeString,
  onNavigateToCustomers,
  sichtbarkeit,
  onSichtbarkeitChange
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [buttonRef, setButtonRef] = React.useState<HTMLButtonElement | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false);
  const [isSichtbarkeitDropdownOpen, setIsSichtbarkeitDropdownOpen] = React.useState(false);

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    onDateRangeChange(newStartDate, newEndDate);
  };

  // Filter adsets based on selected campaigns
  const filteredAdsets = React.useMemo(() => {
    console.log('Filtering adsets:', {
      totalAdsets: adsets.length,
      selectedCampaignIds,
      campaigns: campaigns.length,
      sampleAdset: adsets[0],
      sampleCampaign: campaigns[0]
    });
    
    // If no adsets available, return empty array
    if (adsets.length === 0) {
      console.log('No adsets available');
      return [];
    }
    
    if (selectedCampaignIds.length === 0) {
      // If no campaigns selected, show all adsets for the customer
      const customerCampaignIds = campaigns.map(c => c.id.toString());
      console.log('No campaigns selected, using customer campaign IDs:', customerCampaignIds);
      const filtered = adsets.filter(adset => customerCampaignIds.includes((adset.campaign_id || '').toString()));
      console.log('Filtered adsets for customer campaigns:', filtered.length);
      return filtered;
    }
    
    // Show adsets only for selected campaigns
    console.log('Selected campaign IDs as strings:', selectedCampaignIds);
    const filtered = adsets.filter(adset => {
      const adsetCampaignId = (adset.campaign_id || '').toString();
      const matches = selectedCampaignIds.includes(adsetCampaignId);
      console.log(`Adset ${adset.id} (campaign_id: ${adsetCampaignId}) matches:`, matches);
      return matches;
    });
    console.log('Filtered adsets:', filtered.length);
    return filtered;
  }, [adsets, selectedCampaignIds, campaigns]);

  return (
    <>
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-6 py-4" style={{ backgroundColor: 'white' }}>
        <div className="mt-4 space-y-4 w-full">
          {/* First Row */}
          <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              ref={setButtonRef}
              className="relative appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-72 whitespace-nowrap"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium truncate">{dateRangeString}</span>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="relative">
            <div className="relative">
              <button
                className="relative appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-72"
                style={{ backgroundColor: 'white' }}
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
              >
               <span className="text-sm font-medium truncate">
                 {selectedCustomer.customer_name || selectedCustomer.customer_company_name || 'Unbekannter Kunde'}
               </span>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>

              {isCustomerDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-full min-w-64 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="p-2" style={{ backgroundColor: 'white' }}>
                    {[...customers]
                      .filter((customer) => customer.status === 'Aktiv')
                      .sort((a, b) => {
                        const nameA = (a.customer_name || a.customer_company_name || 'Unbekannter Kunde').toLowerCase();
                        const nameB = (b.customer_name || b.customer_company_name || 'Unbekannter Kunde').toLowerCase();
                        return nameA.localeCompare(nameB);
                      })
                      .map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => {
                            onCustomerChange(customer);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                          style={{ backgroundColor: 'white' }}
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            {selectedCustomer.customer_id === customer.customer_id && <Check className="w-3 h-3 text-blue-600" />}
                          </div>
                          <span className="text-gray-900">
                            {customer.customer_name || customer.customer_company_name || 'Unbekannter Kunde'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
          <MultiSelectDropdown
            options={campaigns.map(c => ({ id: c.id.toString(), name: c.name }))}
            selectedIds={selectedCampaignIds}
            onSelectionChange={onCampaignChange}
            placeholder="Kampagne"
            className="w-72"
          />
          
          <MultiSelectDropdown
            options={filteredAdsets.map(a => ({ id: a.id.toString(), name: a.name }))}
            selectedIds={selectedAdsetIds}
            onSelectionChange={onAdsetChange}
            placeholder="Anzeigengruppe"
            className="w-72"
          />
          </div>
          </div>
          
          {/* Second Row */}
          <div className="flex items-center space-x-4">
          <MultiSelectDropdown
            options={ads.map(a => ({ id: a.id.toString(), name: a.name }))}
            selectedIds={selectedAdIds}
            onSelectionChange={onAdChange}
            placeholder="Creative"
            className="w-72"
          />
          
          <div className="w-72">
            <button className="relative appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-full">
              <span className="text-sm font-medium truncate">Vakanz: Alle</span>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 flex-shrink-0" />
            </button>
          </div>

          <div className="relative w-72">
            <button
              className="relative appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-full"
              style={{ backgroundColor: 'white' }}
              onClick={() => setIsSichtbarkeitDropdownOpen(!isSichtbarkeitDropdownOpen)}
            >
              <span className="text-sm font-medium truncate">Sichtbarkeit: {sichtbarkeit}</span>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 flex-shrink-0" />
            </button>

            {isSichtbarkeitDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl z-50"
                style={{ backgroundColor: 'white' }}
              >
                <div className="p-2" style={{ backgroundColor: 'white' }}>
                  {['Intern', 'Alles'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onSichtbarkeitChange(option);
                        setIsSichtbarkeitDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                      style={{ backgroundColor: 'white' }}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {sichtbarkeit === option && <Check className="w-3 h-3 text-blue-600" />}
                      </div>
                      <span className="text-gray-900">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateRangeChange}
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        buttonRef={buttonRef}
      />
    </>
  );
};