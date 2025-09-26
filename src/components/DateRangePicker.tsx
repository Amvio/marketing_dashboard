import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, X, CalendarDays } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: HTMLButtonElement | null;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  isOpen,
  onClose,
  buttonRef
}) => {
  const [tempStartDate, setTempStartDate] = useState<Date>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(endDate);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const getCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: firstDay, end: lastDay };
  };

  const getLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: firstDay, end: lastDay };
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate offset to Monday
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: monday, end: sunday };
  };

  const getLastWeek = () => {
    const currentWeek = getCurrentWeek();
    const lastWeekStart = new Date(currentWeek.start);
    lastWeekStart.setDate(currentWeek.start.getDate() - 7);
    
    const lastWeekEnd = new Date(currentWeek.end);
    lastWeekEnd.setDate(currentWeek.end.getDate() - 7);
    
    return { start: lastWeekStart, end: lastWeekEnd };
  };

  const handlePresetClick = (preset: 'current-month' | 'last-month' | 'current-week' | 'last-week') => {
    let dates;
    switch (preset) {
      case 'current-month':
        dates = getCurrentMonth();
        break;
      case 'last-month':
        dates = getLastMonth();
        break;
      case 'current-week':
        dates = getCurrentWeek();
        break;
      case 'last-week':
        dates = getLastWeek();
        break;
      default:
        dates = getCurrentMonth();
    }
    setTempStartDate(dates.start);
    setTempEndDate(dates.end);
  };

  React.useEffect(() => {
    if (isOpen && buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + 200 // Move to the right
      });
    }
  }, [isOpen, buttonRef]);

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    onClose();
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
      />
      <div 
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-96 z-50"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          backgroundColor: 'white'
        }}
      >
        <div className="flex items-center justify-between mb-4" style={{ backgroundColor: 'white' }}>
          <h3 className="text-lg font-semibold text-gray-900">Zeitraum auswählen</h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Date Presets */}
        <div className="mb-4" style={{ backgroundColor: 'white' }}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Schnellauswahl</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePresetClick('current-week')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Aktuelle Woche</span>
            </button>
            <button
              onClick={() => handlePresetClick('last-week')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Letzte Woche</span>
            </button>
            <button
              onClick={() => handlePresetClick('current-month')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Aktueller Monat</span>
            </button>
            <button
              onClick={() => handlePresetClick('last-month')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Letzter Monat</span>
            </button>
          </div>
        </div>

        <div className="space-y-4" style={{ backgroundColor: 'white' }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <DatePicker
              selected={tempStartDate}
              onChange={(date: Date) => setTempStartDate(date)}
              selectsStart
              startDate={tempStartDate}
              endDate={tempEndDate}
              maxDate={new Date()}
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              style={{ backgroundColor: 'white', color: '#374151' }}
              placeholderText="Startdatum auswählen"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <DatePicker
              selected={tempEndDate}
              onChange={(date: Date) => setTempEndDate(date)}
              selectsEnd
              startDate={tempStartDate}
              endDate={tempEndDate}
              minDate={tempStartDate}
              maxDate={new Date()}
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              style={{ backgroundColor: 'white', color: '#374151' }}
              placeholderText="Enddatum auswählen"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 mt-6" style={{ backgroundColor: 'white' }}>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Anwenden
          </button>
        </div>
      </div>
    </>
  );
};