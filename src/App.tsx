import React, { useState } from 'react';
import { Scan, Menu, Sparkles, Settings, History, Brain, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ProcessingStatus } from './components/ProcessingStatus';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useOCR } from './hooks/useOCR';

function App() {
  const { processImages, reset, clearHistory, isProcessing, progress, error, results, processedMenus } = useOCR();
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [useGoogleVision, setUseGoogleVision] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileSelect = (files: File[]) => {
    processImages(files, useGoogleVision, apiKey);
  };

  const handleReset = () => {
    reset();
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    setUseGoogleVision(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Menu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Advanced Menu OCR Scanner</h1>
                <p className="text-gray-600">AI-powered menu analysis with health & quality insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {processedMenus.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <History className="h-4 w-4" />
                  <span>History ({processedMenus.length})</span>
                </button>
              )}
              
              <button
                onClick={() => setShowApiModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>API Settings</span>
              </button>
            </div>
          </div>

          {/* OCR Method Toggle */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">OCR Method:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUseGoogleVision(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useGoogleVision
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span>Tesseract.js</span>
              </button>
              <button
                onClick={() => apiKey ? setUseGoogleVision(true) : setShowApiModal(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useGoogleVision && apiKey
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Google Vision API</span>
                {!apiKey && <span className="text-xs">(Setup Required)</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
            <div className="flex items-center space-x-3 mb-6">
              <Scan className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Upload Menu Images</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Multi-file Support
              </span>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            
            {(isProcessing || error) && (
              <div className="mt-6">
                <ProcessingStatus progress={progress} error={error} />
              </div>
            )}

            {(results || error) && !isProcessing && (
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Process More Menus</span>
                </button>
                
                {processedMenus.length > 1 && (
                  <button
                    onClick={clearHistory}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Clear History</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          {results && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-xl">
                  <Menu className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Menu Analysis Results</h2>
              </div>
              
              <ResultsDisplay 
                results={results} 
                isMultipleMenus={'menus' in results}
              />
            </div>
          )}

          {/* Features Info */}
          {!results && !isProcessing && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-white/20">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scan className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Advanced OCR</h3>
                <p className="text-sm text-gray-600">
                  Dual OCR engines with Google Vision API support for maximum accuracy
                </p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-white/20">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Menu className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Smart Parsing</h3>
                <p className="text-sm text-gray-600">
                  AI-enhanced parsing with health analysis, quality assessment, and nutrition insights
                </p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-white/20">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Multi-Menu Analysis</h3>
                <p className="text-sm text-gray-600">
                  Process multiple menus simultaneously with combined analytics and insights
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border border-white/20">
                <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Health & Quality</h3>
                <p className="text-sm text-gray-600">
                  Automatic health scoring, quality assessment, allergen detection, and dietary analysis
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Powered by Tesseract.js, Google Vision API, and AI-enhanced analysis</p>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSave={handleApiKeySave}
        currentApiKey={apiKey}
      />
    </div>
  );
}

export default App;