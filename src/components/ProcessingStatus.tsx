import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { OCRProgress } from '../types/menu';

interface ProcessingStatusProps {
  progress: OCRProgress | null;
  error: string | null;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ progress, error }) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Processing Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const isComplete = progress.progress >= 1;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-4">
        {isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        )}
        <div className="flex-1">
          <h3 className="font-medium text-blue-900">
            {isComplete ? 'Processing Complete' : 'Processing Menu...'}
          </h3>
          <p className="text-sm text-blue-700">{progress.status}</p>
        </div>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress.progress * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-blue-600 mt-2 text-right">
        {Math.round(progress.progress * 100)}%
      </p>
    </div>
  );
};