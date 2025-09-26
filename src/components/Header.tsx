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
  onNavigateToCustomers
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [buttonRef, setButtonRef] = React.useState<HTMLButtonElement | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false);

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    onDateRangeChange(newStartDate, newEndDate);
  };

  return (
    <>
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-6 py-4" style={{ backgroundColor: 'white' }}>
        <div className="mt-4 flex items-center space-x-4 w-full">
          <div className="relative">
            <button
              ref={setButtonRef}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 min-w-48 whitespace-nowrap"
              onClick={() => setIsDatePickerOpen(true)}
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium truncate">{dateRangeString}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
            </button>
          </div>
          
          <div className="relative">
            <div className="relative">
              <button
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-48"
                style={{ backgroundColor: 'white' }}
                onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
              >
               <span className="text-sm font-medium truncate">
                 {selectedCustomer.customer_name || selectedCustomer.customer_company_name || 'Unbekannter Kunde'}
               </span>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" />
              </button>

              {isCustomerDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 w-full min-w-64 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="p-2" style={{ backgroundColor: 'white' }}>
                    {customers.map((customer) => (
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
          
          <div className="flex-1 flex items-center space-x-4">
          <MultiSelectDropdown
            options={campaigns.map(c => ({ id: c.id.toString(), name: c.name }))}
            selectedIds={selectedCampaignIds}
            onSelectionChange={onCampaignChange}
            placeholder="Kampagne"
            icon={<Settings className="w-4 h-4 text-gray-400" />}
            className="w-64"
          />
          
          <MultiSelectDropdown
            options={adsets.map(a => ({ id: a.id.toString(), name: a.name }))}
            selectedIds={selectedAdsetIds}
            onSelectionChange={onAdsetChange}
            placeholder="Anzeigengruppe"
            icon={<Target className="w-4 h-4 text-gray-400" />}
            className="w-64"
          />
          
          <MultiSelectDropdown
            options={ads.map(a => ({ id: a.id.toString(), name: a.name }))}
            selectedIds={selectedAdIds}
            onSelectionChange={onAdChange}
            placeholder="Creative"
            icon={<Target className="w-4 h-4 text-gray-400" />}
            className="w-64"
          />
          
          <div className="w-64">
            <button className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 w-full">
              <span className="text-sm font-medium truncate">Vakanz: Alle</span>
              <ChevronDown className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" />
            </button>
          </div>
          </div>
        </div>
        
        {/* Customer Logo - aligned with other elements */}
      <div className="absolute right-6 top-4 mt-4">
        {selectedCustomer.logo_url ? (
          <img 
            src={selectedCustomer.logo_url} 
            alt={selectedCustomer.customer_name || selectedCustomer.customer_company_name || 'Customer Logo'}
            className="h-8 w-auto"
          />
        ) : (
          <div className="text-right">
            <span className="text-gray-900 font-semibold text-sm">
              {selectedCustomer.customer_name || selectedCustomer.customer_company_name || 'Unbekannter Kunde'}
            </span>
          </div>
        )}
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