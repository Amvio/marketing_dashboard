import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SimpleHeaderProps {
  onBackToDashboard: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({ onBackToDashboard }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zurück zum Dashboard</span>
        </button>
      </div>
    </div>
  );
};