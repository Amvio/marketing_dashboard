import React from 'react';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { generateDateRange } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue: number;
  chartData: number[];
  color: string;
  icon?: React.ReactNode;
  startDate: Date;
  endDate: Date;
  libraryId: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  chartData,
  color,
  icon,
  startDate,
  endDate,
  libraryId
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [libraryDescription, setLibraryDescription] = useState<string>('');
  const [iconPosition, setIconPosition] = useState({ x: 0, y: 0 });

  const maxValue = Math.max(...chartData);
  const formatValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(val >= 10000 ? 0 : 1) + 'k';
    }
    return val.toString();
  };

  const calculatePercentageChange = () => {
    if (previousValue === 0) return value > 0 ? 100 : 0;
    return ((value - previousValue) / previousValue) * 100;
  };

  const percentageChange = calculatePercentageChange();
  const isPositive = percentageChange >= 0;

  const handleMouseEnter = (index: number, event: React.MouseEvent) => {
    setHoveredIndex(index);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleIconMouseEnter = (event: React.MouseEvent) => {
    console.log('Icon hovered for:', title);
    setIsIconHovered(true);
    const rect = event.currentTarget.getBoundingClientRect();
    setIconPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5
    });
    console.log('Description:', libraryDescription);
  };

  const handleIconMouseLeave = () => {
    setIsIconHovered(false);
  };

  useEffect(() => {
    const fetchLibraryEntry = async () => {
      try {
        const { data, error } = await supabase
          .from('library')
          .select('description')
          .eq('id', libraryId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching library entry:', error);
        } else if (data) {
          console.log('Library entry found for ID', libraryId, ':', data.description);
          setLibraryDescription(data.description || '');
        } else {
          console.log('No library entry found for ID', libraryId);
        }
      } catch (err) {
        console.error('Exception fetching library entry:', err);
      }
    };

    fetchLibraryEntry();
  }, [libraryId]);


  // Generate dates for the chart data using the actual date range
  const chartDates = generateDateRange(startDate, endDate).map(dateString => {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}`;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 relative w-full h-full min-h-[200px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-600 truncate flex-1 min-w-0">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {icon && (
            <div
              className="text-gray-400 cursor-help"
              onMouseEnter={handleIconMouseEnter}
              onMouseLeave={handleIconMouseLeave}
            >
              {icon}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4 flex-1">
        <div className="flex items-baseline space-x-2 mb-1">
          <span className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </span>
          <div className={`flex items-center space-x-1 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-16 flex items-end space-x-1 mt-auto">
        {chartData.map((dataPoint, index) => (
          <div
            key={index}
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
            className={`w-full rounded-t-sm ${color} opacity-70 hover:opacity-100 transition-opacity`}
            style={{
              height: `${maxValue > 0 ? (dataPoint / maxValue) * 100 : 0}%`,
              minHeight: dataPoint > 0 ? '4px' : '2px',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="fixed bg-white text-gray-900 text-xs rounded px-2 py-1 pointer-events-none z-50 shadow-lg border border-gray-200"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            backgroundColor: 'white'
          }}
        >
          <div className="text-center">
            <div className="font-medium">{chartDates[hoveredIndex]}</div>
            <div>{formatValue(chartData[hoveredIndex])}</div>
          </div>
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
          />
        </div>
      )}

      {/* Icon hover tooltip */}
      {isIconHovered && libraryDescription && (
        <div
          className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 z-[9999] min-w-[300px] max-w-[500px]"
          style={{
            left: `${iconPosition.x}px`,
            top: `${iconPosition.y}px`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            backgroundColor: '#ffffff'
          }}
        >
          <div className="font-bold text-gray-900 mb-2">{title}</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{libraryDescription}</div>
        </div>
      )}
    </div>
  );
};