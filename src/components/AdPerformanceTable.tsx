import React from 'react';
import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Ad, AdInsight, Campaign, Adset } from '../types/dashboard';

interface AdCreative {
  id: number;
  name: string | null;
  image_url: string | null;
}

interface AdWithMetrics {
  id: number;
  name: string;
  image_url: string | null;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  frequency: number;
  leads: number;
}

interface AdPerformanceTableProps {
  ads: Ad[];
  adInsights: AdInsight[];
  adCreatives: AdCreative[];
  selectedCustomer: any;
  selectedCampaignIds: string[];
  selectedAdsetIds: string[];
  selectedAdIds: string[];
  campaigns: Campaign[];
  adsets: Adset[];
  startDate: Date;
  endDate: Date;
}

export const AdPerformanceTable: React.FC<AdPerformanceTableProps> = ({
  ads,
  adInsights,
  adCreatives,
  selectedCustomer,
  selectedCampaignIds,
  selectedAdsetIds,
  selectedAdIds,
  campaigns,
  adsets,
  startDate,
  endDate
}) => {
  const [selectedSortOption, setSelectedSortOption] = useState<'impressions' | 'ctr' | 'leads'>('impressions');
  const [showAllRows, setShowAllRows] = useState(false);
  const [hoveredAd, setHoveredAd] = useState<{ ad: AdWithMetrics; creative: AdCreative | null; x: number; y: number } | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE');
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatCurrency = (num: number) => {
    return `€${num.toFixed(2)}`;
  };

  const formatFrequency = (num: number) => {
    return num.toFixed(2);
  };
  // Helper function to format date as YYYY-MM-DD string
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter ads based on hierarchy
  const getFilteredAds = (): Ad[] => {
    let filteredAds = ads;

    // Filter by selected customer's campaigns/adsets/ads
    if (selectedAdIds.length > 0) {
      filteredAds = filteredAds.filter(ad => selectedAdIds.includes(ad.id.toString()));
    } else if (selectedAdsetIds.length > 0) {
      filteredAds = filteredAds.filter(ad => selectedAdsetIds.includes(ad.ad_set_id?.toString() || ''));
    } else if (selectedCampaignIds.length > 0) {
      const selectedAdsetIdsFromCampaigns = adsets
        .filter(adset => selectedCampaignIds.includes(adset.campaign_id?.toString() || ''))
        .map(adset => adset.id);
      filteredAds = filteredAds.filter(ad => selectedAdsetIdsFromCampaigns.includes(ad.ad_set_id || 0));
    } else if (selectedCustomer) {
      // If no specific selections, include all ads for the customer
      const customerCampaignIds = campaigns
        .filter(c => c.customer_id === selectedCustomer.customer_id)
        .map(c => c.id);
      const customerAdsetIds = adsets
        .filter(adset => customerCampaignIds.includes(adset.campaign_id || 0))
        .map(adset => adset.id);
      filteredAds = filteredAds.filter(ad => customerAdsetIds.includes(ad.ad_set_id || 0));
    }

    // Sort based on selected option
    const sortedAds = filteredAds.slice(); // Create a copy to avoid mutating original array
    
    if (selectedSortOption === 'impressions') {
      // Already sorted by impressions in calculateAdMetrics
      return sortedAds;
    } else if (selectedSortOption === 'ctr') {
      return sortedAds; // Will be sorted by CTR in calculateAdMetrics
    } else if (selectedSortOption === 'leads') {
      return sortedAds; // Would be sorted by leads if we had that data
    }
    
    return sortedAds;
  };

  // Calculate metrics for each ad
  const calculateAdMetrics = (): AdWithMetrics[] => {
    const filteredAds = getFilteredAds();
    const startDateString = formatDateString(startDate);
    const endDateString = formatDateString(endDate);

    const adsWithMetrics = filteredAds.map(ad => {
      // Find insights for this ad within the date range
      const adInsightsForAd = adInsights.filter(insight => 
        insight.ad_id === ad.id &&
        insight.date >= startDateString &&
        insight.date <= endDateString
      );

      // Calculate aggregated metrics
      const totalImpressions = adInsightsForAd.reduce((sum, insight) => sum + (insight.impressions || 0), 0);
      const totalReach = adInsightsForAd.reduce((sum, insight) => sum + (insight.reach || 0), 0);
      const totalClicks = adInsightsForAd.reduce((sum, insight) => sum + (insight.clicks || 0), 0);
      const averageFrequency = adInsightsForAd.length > 0
        ? adInsightsForAd.reduce((sum, insight) => sum + (insight.frequency || 0), 0) / adInsightsForAd.length
        : 0;
      const totalLeads = adInsightsForAd.reduce((sum, insight) => sum + (insight.conversions || 0), 0);

      // Find creative for this ad
      const creative = adCreatives.find(creative => creative.id === ad.creative_id);

      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      return {
        id: ad.id,
        name: ad.name,
        image_url: creative?.image_url || null,
        impressions: totalImpressions,
        reach: totalReach,
        clicks: totalClicks,
        ctr: ctr,
        frequency: averageFrequency,
        leads: totalLeads
      };
    }).filter(ad => ad.impressions > 0); // Only show ads with impressions
    
    // Sort based on selected option
    let sortedAds: AdWithMetrics[];
    if (selectedSortOption === 'impressions') {
      sortedAds = adsWithMetrics.sort((a, b) => b.impressions - a.impressions);
    } else if (selectedSortOption === 'ctr') {
      sortedAds = adsWithMetrics.sort((a, b) => b.ctr - a.ctr);
    } else if (selectedSortOption === 'leads') {
      // Since we don't have leads data, keep impressions sorting
      sortedAds = adsWithMetrics.sort((a, b) => b.impressions - a.impressions);
    } else {
      sortedAds = adsWithMetrics.sort((a, b) => b.impressions - a.impressions);
    }
    
    return sortedAds; // Return all ads, we'll limit display in render
  };


  const handleSortOptionChange = (option: 'impressions' | 'ctr' | 'leads') => {
    setSelectedSortOption(option);
  };

  const adsWithMetrics = calculateAdMetrics();
  const displayedAds = showAllRows ? adsWithMetrics : adsWithMetrics.slice(0, 3);

  const handleImageHover = (ad: AdWithMetrics, event: React.MouseEvent) => {
    const creative = adCreatives.find(creative => creative.id === ads.find(a => a.id === ad.id)?.creative_id);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredAd({
      ad,
      creative: creative || null,
      x: rect.right + 10,
      y: rect.top
    });
  };

  const handleImageLeave = () => {
    setHoveredAd(null);
  };

  const handleImageError = (adId: number) => {
    console.error('Image failed to load for ad ID:', adId);
    setImageLoadErrors(prev => new Set(prev).add(adId));
  };

  React.useEffect(() => {
    console.log('AdCreatives data:', adCreatives);
    console.log('Ads data:', ads);
  }, [adCreatives, ads]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative" ref={tableRef}>
      <h3 className="text-lg font-semibold text-purple-600 mb-4">Ausgewählte Anzeigen</h3>
      
      <div className="flex items-center space-x-6 mb-6">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="nach-impressionen"
            checked={selectedSortOption === 'impressions'}
            onChange={() => handleSortOptionChange('impressions')}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <label htmlFor="nach-impressionen" className="text-sm font-medium text-gray-700">
            Nach Impressionen
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="nach-ctr"
            checked={selectedSortOption === 'ctr'}
            onChange={() => handleSortOptionChange('ctr')}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <label htmlFor="nach-ctr" className="text-sm font-medium text-gray-700">
            Nach CTR
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="nach-leads"
            checked={selectedSortOption === 'leads'}
            onChange={() => handleSortOptionChange('leads')}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <label htmlFor="nach-leads" className="text-sm font-medium text-gray-700">
            Nach Leads
          </label>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-48">Ad Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Ad Image</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-32">
                <div className="flex items-center space-x-2">
                  <span>Impressions</span>
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Reichweite</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Klicks</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">CTR</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-24">Frequency</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-20">Leads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedAds.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Keine Anzeigen für den ausgewählten Zeitraum gefunden
                </td>
              </tr>
            ) : (
              displayedAds.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 text-sm block truncate" title={ad.name}>
                      {ad.name}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {ad.image_url && !imageLoadErrors.has(ad.id) ? (
                      <div className="relative w-16 h-16">
                        <img
                          src={ad.image_url}
                          alt={ad.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                          referrerPolicy="no-referrer"
                          onMouseEnter={(e) => handleImageHover(ad, e)}
                          onMouseLeave={handleImageLeave}
                          onError={() => handleImageError(ad.id)}
                          onLoad={() => console.log('Image loaded successfully for ad:', ad.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg shadow-sm flex items-center justify-center">
                        <X className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-900 font-medium">
                    {formatNumber(ad.impressions)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatNumber(ad.reach)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatNumber(ad.clicks)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatPercentage(ad.ctr)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatFrequency(ad.frequency)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {formatNumber(ad.leads)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Show expand/collapse button only if there are more than 3 ads */}
      {adsWithMetrics.length > 3 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <span className="text-sm font-medium">
              {showAllRows ? 'Weniger anzeigen' : 'Alle Creatives'}
            </span>
            {showAllRows ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Hover Tooltip */}
      {hoveredAd && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-xl p-4 z-50"
          style={{
            left: `${hoveredAd.x}px`,
            top: `${hoveredAd.y}px`,
            backgroundColor: 'white',
            width: '400px'
          }}
        >
          {hoveredAd.ad.image_url && (
            <img
              src={hoveredAd.ad.image_url}
              className="w-full aspect-square object-cover rounded-lg mb-3"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="space-y-2">
            {hoveredAd.creative && hoveredAd.creative.title && (
              <p className="text-gray-600 text-xs font-medium">
                {hoveredAd.creative.title}
              </p>
            )}
            {hoveredAd.creative && hoveredAd.creative.body && (
              <p className="text-gray-700 text-xs leading-relaxed">
                {hoveredAd.creative.body}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};