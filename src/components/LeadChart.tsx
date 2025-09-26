import React, { useState } from 'react';
import { ChartDataPoint } from '../types/dashboard';
import { ChevronDown } from 'lucide-react';

interface LeadChartProps {
  data: ChartDataPoint[];
  metricsData: Array<{
    id: string;
    title: string;
    value: number;
    chartData: number[];
  }>;
}

export const LeadChart: React.FC<LeadChartProps> = ({ data, metricsData }) => {
  const [selectedMetric1, setSelectedMetric1] = useState(metricsData[0]?.id || 'leads');
  const [selectedMetric2, setSelectedMetric2] = useState(metricsData[1]?.id || 'linkClicks');
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number } | null>(null);
  
  const currentMetric1 = metricsData.find(m => m.id === selectedMetric1) || metricsData[0];
  const currentMetric2 = metricsData.find(m => m.id === selectedMetric2) || metricsData[1];
  const chartData1 = currentMetric1?.chartData || data.map(d => d.leads);
  const chartData2 = currentMetric2?.chartData || data.map(d => d.leads);
  
  // Separate max values for dual axis with 20% padding
  const dataMax1 = Math.max(...chartData1, 1);
  const dataMax2 = Math.max(...chartData2, 1);
  const maxValue1 = Math.ceil(dataMax1 * 1.2); // Add 20% padding
  const maxValue2 = Math.ceil(dataMax2 * 1.2); // Add 20% padding
  
  // Fixed colors
  const metricColor1 = '#1e3a8a'; // Dark blue
  const metricColor2 = '#166534'; // Dark green

  // Create line chart points for dual axis
  const createLinePath = (chartData: number[], maxValue: number) => {
    if (chartData.length === 0) return '';
    if (chartData.length === 1) {
      // For single data point, create a centered point
      const y = 100 - (chartData[0] / maxValue) * 100;
      return `M 50 ${y}`;
    }
    
    const width = 100; // percentage
    const height = 100; // percentage
    const stepX = width / (chartData.length - 1);
    
    // Create smooth curve using quadratic bezier curves
    let path = '';
    const points = chartData.map((value, index) => ({
      x: index * stepX,
      y: height - (value / maxValue) * height
    }));
    
    // Start the path
    path = `M ${points[0].x} ${points[0].y}`;
    
    // Create smooth curves between points
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      
      // Use smooth cubic bezier for all curves
      const prevPrevPoint = i > 1 ? points[i - 2] : points[i - 1];
      const nextPoint = points[i + 1] || currentPoint;
      
      // Calculate control points for smooth curve
      const tension = 0.05; // Much sharper curves - reduced from 0.2 to 0.05
      const cp1x = prevPoint.x + (currentPoint.x - prevPrevPoint.x) * tension;
      const cp1y = prevPoint.y + (currentPoint.y - prevPrevPoint.y) * tension;
      const cp2x = currentPoint.x - (nextPoint.x - prevPoint.x) * tension;
      const cp2y = currentPoint.y - (nextPoint.y - prevPoint.y) * tension;
      
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentPoint.x} ${currentPoint.y}`;
    }
    
    return path;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    
    // Find the closest data point
    const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;
    const closestIndex = Math.round(x / stepX);
    
    if (closestIndex >= 0 && closestIndex < data.length) {
      setHoveredPoint({
        index: closestIndex,
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-purple-600">Ausgewählte Metrik:</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedMetric1}
              onChange={(e) => setSelectedMetric1(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 font-medium"
            >
              {metricsData.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.title}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select
              value={selectedMetric2}
              onChange={(e) => setSelectedMetric2(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm text-gray-900 font-medium"
            >
              {metricsData.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.title}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: metricColor1 }}></div>
            <span>{currentMetric1?.title || 'Leads'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: metricColor2 }}></div>
            <span>{currentMetric2?.title || 'Link Clicks'}</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-64">
        {/* Left Y-axis labels (Metric 1) - Fixed width */}
        <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 pr-2 w-12 text-right">
          {(() => {
            const step = Math.ceil(maxValue1 / 4);
            const values = [maxValue1, maxValue1 - step, maxValue1 - 2 * step, maxValue1 - 3 * step, 0]
              .filter(v => v >= 0)
              .filter((value, index, array) => array.indexOf(value) === index);
            return values.map((value, index) => (
              <span key={index}>{value}</span>
            ));
          })()}
        </div>
        
        {/* Right Y-axis labels (Metric 2) - Fixed width */}
        <div className="absolute right-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500 pl-2 w-12 text-left">
          {(() => {
            const step = Math.ceil(maxValue2 / 4);
            const values = [maxValue2, maxValue2 - step, maxValue2 - 2 * step, maxValue2 - 3 * step, 0]
              .filter(v => v >= 0)
              .filter((value, index, array) => array.indexOf(value) === index);
            return values.map((value, index) => (
              <span key={index}>{value}</span>
            ));
          })()}
        </div>
        
        {/* Chart area */}
        <div className="mx-12 px-2 h-full">
          <div className="h-48 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-100"></div>
              ))}
            </div>
            
            {/* SVG Line Chart */}
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              style={{ overflow: 'visible' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* First Line (uses left axis) */}
              <path
                d={createLinePath(chartData1, maxValue1)}
                fill="none"
                stroke={metricColor1}
                strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-sm"
               style={{ strokeLinejoin: 'round', strokeLinecap: 'round' }}
              />
              
              {/* Second Line (uses right axis) */}
              <path
                d={createLinePath(chartData2, maxValue2)}
                fill="none"
                stroke={metricColor2}
                strokeWidth="1.5"
               strokeLinecap="round"
               strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-sm"
               style={{ strokeLinejoin: 'round', strokeLinecap: 'round' }}
              />
              
              {/* Invisible overlay for better hover detection */}
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="transparent"
                style={{ cursor: 'crosshair' }}
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* X-axis labels completely outside and below the chart */}
      <div className="mt-6 mx-8 flex justify-between text-xs text-gray-500">
        {data.map((point, index) => (
          <span key={index} className="transform -rotate-45 origin-left whitespace-nowrap">
            {point.date}
          </span>
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed bg-white text-gray-900 text-xs rounded px-3 py-2 pointer-events-none z-50 shadow-lg border border-gray-200"
          style={{
            left: `${hoveredPoint.x}px`,
            top: `${hoveredPoint.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            backgroundColor: 'white'
          }}
        >
          <div className="text-center">
            <div className="font-medium mb-1">{data[hoveredPoint.index]?.date || 'N/A'}</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: metricColor1 }}></div>
                <span className="text-gray-900">{currentMetric1?.title}: {chartData1[hoveredPoint.index]}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: metricColor2 }}></div>
                <span className="text-gray-900">{currentMetric2?.title}: {chartData2[hoveredPoint.index]}</span>
              </div>
            </div>
          </div>
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
          />
        </div>
      )}
    </div>
  );
};