import React, { useState } from 'react';
import { Home, Settings, ChevronDown, FileDown, Terminal } from 'lucide-react';
import { Customer } from '../types/dashboard';

interface NavbarProps {
  onNavigateToDashboard?: () => void;
  onNavigateToCustomers?: () => void;
  onNavigateToSupabaseTables?: () => void;
  onNavigateToSupabaseCustomers?: () => void;
  onNavigateToSupabaseCampaigns?: () => void;
  onExport?: () => void;
  selectedCustomer?: Customer | null;
  currentPage?: 'dashboard' | 'supabase-tables' | 'supabase-customers' | 'supabase-campaigns';
  consoleMessages?: string[];
  onClearConsole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigateToDashboard, 
  onNavigateToCustomers,
  onNavigateToSupabaseTables,
  onNavigateToSupabaseCustomers,
  onNavigateToSupabaseCampaigns,
  onExport,
  selectedCustomer,
  currentPage,
  consoleMessages = [],
  onClearConsole
}) => {
  const [openDropdown, setOpenDropdown] = useState<'menu' | 'settings' | 'console' | null>(null);

  const handleDashboardClick = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
    setOpenDropdown(null);
  };

  const handleCustomersClick = () => {
    if (onNavigateToCustomers) {
      onNavigateToCustomers();
    }
    setOpenDropdown(null);
  };

  const handleSupabaseTablesClick = () => {
    if (onNavigateToSupabaseTables) {
      onNavigateToSupabaseTables();
    }
    setOpenDropdown(null);
  };

  const handleSupabaseCampaignsClick = () => {
    if (onNavigateToSupabaseCampaigns) {
      onNavigateToSupabaseCampaigns();
    }
    setOpenDropdown(null);
  };

  return (
    <nav className="navbar-container sticky top-0 z-[9999] bg-white border-b border-gray-200 px-6 py-4" style={{ backgroundColor: 'white' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/Schmal_Amvio Logo.png" 
                alt="AMVIO" 
                className="h-8 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-xs text-gray-600">Einfach.Digital.Effizient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Logo Box - Only show on dashboard */}
        {currentPage === 'dashboard' && selectedCustomer && (
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center justify-center h-[42px] py-2">
              {selectedCustomer.logo_url ? (
                <img 
                  src={selectedCustomer.logo_url} 
                  alt={`${selectedCustomer.customer_name || selectedCustomer.customer_company_name} Logo`}
                  className="h-full w-auto object-contain max-w-32 max-h-[42px]"
                />
              ) : (
                <div className="h-full aspect-square bg-gray-200 rounded flex items-center justify-center max-h-[42px]">
                  <span className="text-xl font-medium text-gray-500">
                    {(selectedCustomer.customer_name || selectedCustomer.customer_company_name || 'K')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'menu' ? null : 'menu')}
              className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Menü</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'menu' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'menu' && (
              <div 
                className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[10000]"
                style={{ backgroundColor: 'white' }}
              >
                <div className="p-2" style={{ backgroundColor: 'white' }}>
                  <button 
                    onClick={handleDashboardClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" 
                    style={{ backgroundColor: 'white' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Dashboard</span>
                  </button>
                  <button 
                    onClick={handleCustomersClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" 
                    style={{ backgroundColor: 'white' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Kunden</span>
                  </button>
                  <button 
                    onClick={handleSupabaseTablesClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" 
                    style={{ backgroundColor: 'white' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Datenbanken</span>
                  </button>
                  <button 
                    onClick={handleSupabaseCampaignsClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" 
                    style={{ backgroundColor: 'white' }}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Kampagnen</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" style={{ backgroundColor: 'white' }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Berichte</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'console' ? null : 'console')}
              className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Console</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'console' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'console' && (
              <div 
                className="fixed top-16 left-0 w-screen max-h-64 bg-black text-green-400 font-mono text-xs shadow-xl overflow-hidden z-[10002] border border-gray-600"
                style={{ backgroundColor: 'black' }}
              >
                <div className="bg-gray-800 px-3 py-2 border-b border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Debug Console</span>
                    <button
                      onClick={onClearConsole}
                      className="text-gray-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="p-3 overflow-y-auto max-h-48" style={{ backgroundColor: 'black' }}>
                  {consoleMessages.length === 0 ? (
                    <div className="text-gray-500" style={{ color: '#6b7280' }}>No messages...</div>
                  ) : (
                    consoleMessages.map((message, index) => (
                      <div key={index} className="mb-1 break-words text-green-400" style={{ color: '#4ade80' }}>
                        {message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onExport}
            className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'settings' ? null : 'settings')}
              className="flex items-center space-x-2 border-2 border-primary-blue hover:border-secondary-blue text-primary-blue hover:text-secondary-blue bg-transparent px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Einstellungen</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'settings' ? 'rotate-180' : ''}`} />
            </button>
            
            {openDropdown === 'settings' && (
              <div 
                className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[10001]"
                style={{ backgroundColor: 'white' }}
              >
                <div className="p-2" style={{ backgroundColor: 'white' }}>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" style={{ backgroundColor: 'white' }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Profil</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" style={{ backgroundColor: 'white' }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Benachrichtigungen</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" style={{ backgroundColor: 'white' }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">API-Einstellungen</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150" style={{ backgroundColor: 'white' }}>
                    <div className="w-4 h-4 flex items-center justify-center">
                    </div>
                    <span className="text-gray-900">Abmelden</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};