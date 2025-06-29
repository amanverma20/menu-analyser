import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, Plus } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isProcessing: boolean;
  allowMultiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  isProcessing, 
  allowMultiple = true 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files);
    }
  }, []);

  const handleFileSelection = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length > 0) {
      const newFiles = allowMultiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(newFiles);
      
      // Create preview URLs for images
      const newUrls = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      
      const allUrls = allowMultiple ? [...previewUrls, ...newUrls] : newUrls;
      setPreviewUrls(allUrls);
      
      onFileSelect(newFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL for removed file
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    onFileSelect(newFiles);
  };

  const clearAllFiles = () => {
    previewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return (
    <div className="w-full space-y-4">
      {selectedFiles.length === 0 ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            multiple={allowMultiple}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop your menu {allowMultiple ? 'images' : 'image'} here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse files
          </p>
          <p className="text-xs text-gray-400">
            Supports JPG, PNG, and PDF files{allowMultiple ? ' (multiple files allowed)' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Selected Files ({selectedFiles.length})
            </h3>
            {!isProcessing && (
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm truncate max-w-32">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {previewUrls[index] && (
                  <img
                    src={previewUrls[index]}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover bg-gray-50 rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>

          {allowMultiple && !isProcessing && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('additional-files')?.click()}
            >
              <input
                id="additional-files"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <Plus className="mx-auto h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Add more files</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};