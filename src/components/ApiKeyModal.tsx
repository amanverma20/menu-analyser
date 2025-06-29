import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, AlertCircle, ExternalLink } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentApiKey 
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Google Vision API Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Vision API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google Vision API key"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-900 mb-2">⚠️ Critical Requirements:</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• <strong>Enable Cloud Vision API</strong> in your Google Cloud project</li>
                  <li>• <strong>Enable billing</strong> for your Google Cloud project</li>
                  <li>• API key must have Vision API permissions</li>
                  <li>• Project must have sufficient quota</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center">
              📋 Complete Setup Guide:
            </h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <div>
                  Go to{' '}
                  <a 
                    href="https://console.cloud.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-900 inline-flex items-center"
                  >
                    Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <div>Create a new project or select existing project</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <div>
                  Go to{' '}
                  <a 
                    href="https://console.cloud.google.com/apis/library/vision.googleapis.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-900 inline-flex items-center"
                  >
                    Vision API page <ExternalLink className="h-3 w-3 ml-1" />
                  </a>{' '}
                  and click <strong>"ENABLE"</strong>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <div>
                  Enable billing at{' '}
                  <a 
                    href="https://console.cloud.google.com/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-900 inline-flex items-center"
                  >
                    Billing page <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">5.</span>
                <div>
                  Go to{' '}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-900 inline-flex items-center"
                  >
                    Credentials page <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">6.</span>
                <div>Click <strong>"CREATE CREDENTIALS"</strong> → <strong>"API key"</strong></div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">7.</span>
                <div>Copy the API key and paste it above</div>
              </li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
            <h4 className="font-medium text-green-900 mb-2">💡 Pro Tips:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• First 1,000 Vision API calls per month are free</li>
              <li>• Restrict your API key to Vision API only for security</li>
              <li>• Monitor usage in Google Cloud Console</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};