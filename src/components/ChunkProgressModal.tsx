import React from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ChunkProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChunk: number;
  totalChunks: number;
  chunkStartDate: string;
  chunkEndDate: string;
  overallStartDate: string;
  overallEndDate: string;
  itemsProcessed: number;
  status: 'processing' | 'completed' | 'error' | 'timeout';
  errorMessage?: string;
  canCancel: boolean;
  onCancel?: () => void;
}

export const ChunkProgressModal: React.FC<ChunkProgressModalProps> = ({
  isOpen,
  onClose,
  currentChunk,
  totalChunks,
  chunkStartDate,
  chunkEndDate,
  overallStartDate,
  overallEndDate,
  itemsProcessed,
  status,
  errorMessage,
  canCancel,
  onCancel
}) => {
  if (!isOpen) return null;

  const progressPercentage = Math.round((currentChunk / totalChunks) * 100);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={status === 'completed' || status === 'error' ? onClose : undefined}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-full max-w-lg">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {status === 'processing' && (
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                )}
                {status === 'completed' && (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                {(status === 'error' || status === 'timeout') && (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {status === 'processing' && 'Verarbeite Ad Insights...'}
                    {status === 'completed' && 'Abfrage abgeschlossen'}
                    {status === 'timeout' && 'Teilweise abgeschlossen'}
                    {status === 'error' && 'Fehler aufgetreten'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Zeitraum: {overallStartDate} bis {overallEndDate}
                  </p>
                </div>
              </div>
              {(status === 'completed' || status === 'error') && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Gesamtfortschritt
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {currentChunk} von {totalChunks} Chunks
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500">{progressPercentage}%</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Aktueller Chunk:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {chunkStartDate} bis {chunkEndDate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verarbeitete Items:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {itemsProcessed}
                  </span>
                </div>
              </div>

              {status === 'timeout' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Zeitüberschreitung erkannt
                      </p>
                      <p className="text-sm text-orange-800 mt-1">
                        Der aktuelle Chunk wurde teilweise verarbeitet. Die Daten wurden bis zum letzten erfolgreichen Eintrag gespeichert.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Fehler bei der Verarbeitung
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Erfolgreich abgeschlossen
                      </p>
                      <p className="text-sm text-green-800 mt-1">
                        Alle {totalChunks} Chunks wurden erfolgreich verarbeitet. Insgesamt {itemsProcessed} Items gespeichert.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                {status === 'processing' && canCancel && onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                )}
                {(status === 'completed' || status === 'error') && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Schließen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
