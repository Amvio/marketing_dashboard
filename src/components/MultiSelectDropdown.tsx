import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  placeholder,
  icon,
  className = "w-48"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (selectedIds.length === 0 || selectedIds.length === options.length) {
      return `${placeholder}: Alle`;
    } else if (selectedIds.length === 1) {
      const selectedOption = options.find(option => option.id === selectedIds[0]);
      return `${placeholder}: ${selectedOption?.name || ''}`;
    } else {
      return `${placeholder}: Mehrere`;
    }
  };

  const handleOptionToggle = (optionId: string) => {
    const newSelectedIds = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    
    onSelectionChange(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(options.map(option => option.id));
    }
  };

  const isAllSelected = selectedIds.length === options.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2 ${className}`}
        style={{ backgroundColor: 'white' }}
      >
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className="text-sm font-medium truncate">{getDisplayText()}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 ml-auto flex-shrink-0" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-full min-w-64 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
          style={{ backgroundColor: 'white' }}
        >
          <div className="p-2" style={{ backgroundColor: 'white' }}>
            <button
              onClick={handleSelectAll}
              className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
              style={{ backgroundColor: 'white' }}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {isAllSelected && <Check className="w-3 h-3 text-blue-600" />}
              </div>
              <span className="font-medium text-gray-900">Alle auswählen</span>
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionToggle(option.id)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded flex items-center space-x-2 transition-colors duration-150"
                style={{ backgroundColor: 'white' }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {selectedIds.includes(option.id) && <Check className="w-3 h-3 text-blue-600" />}
                </div>
                <span className="text-gray-900">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};