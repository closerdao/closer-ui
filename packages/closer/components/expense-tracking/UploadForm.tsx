import React, { useState } from 'react';

import { Loader2, Upload } from 'lucide-react';

import { Button, Card } from '../ui';
import Heading from '../ui/Heading';

interface UploadFormProps {
  onFileSelect: (file: File | null) => void;
  onParseWithLLM: () => void;
  file: File | null;
  photo: string | null;
  loading: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({
  onFileSelect,
  onParseWithLLM,
  file,
  photo,
  loading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await onFileSelect(droppedFiles[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    if (
      selectedFile &&
      (selectedFile.type.startsWith('image/') ||
        selectedFile.type === 'application/pdf')
    ) {
      onFileSelect(selectedFile);
    } else if (selectedFile) {
      console.error('Error: Please select a valid image or PDF file');
    }
  };

  return (
    <Card className="bg-background w-full sm:w-[400px]">
      <Heading level={3}>Upload purchase document</Heading>

      <p className="text-sm text-gray-500">
        The photo/scan must include all the items purchased and be fully
        legible. JPG, PNG, GIF, PDF formats are supported.
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        className={`block w-full cursor-pointer border-2 border-dashed p-6 rounded-xl text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 text-blue-500'
            : file
            ? 'border-green-500 text-green-500'
            : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500'
        }`}
      >
        {file ? (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              {file.name.length > 33
                ? (() => {
                    const lastDotIndex = file.name.lastIndexOf('.');
                    if (lastDotIndex === -1) {
                      return `${file.name.substring(0, 30)}...`;
                    }
                    const extension = file.name.substring(lastDotIndex);
                    const nameWithoutExt = file.name.substring(0, lastDotIndex);
                    const maxNameLength = 33 - extension.length - 3;
                    return `${nameWithoutExt.substring(
                      0,
                      maxNameLength,
                    )}...${extension}`;
                  })()
                : file.name}
            </span>
            {photo &&
              (file?.type === 'application/pdf' ? (
                <div className="max-w-full h-32 flex items-center justify-center mx-auto rounded border border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-xs text-gray-600">
                      {file.name.length > 33
                        ? (() => {
                            const lastDotIndex = file.name.lastIndexOf('.');
                            if (lastDotIndex === -1) {
                              return `${file.name.substring(0, 30)}...`;
                            }
                            const extension = file.name.substring(lastDotIndex);
                            const nameWithoutExt = file.name.substring(
                              0,
                              lastDotIndex,
                            );
                            const maxNameLength = 33 - extension.length - 3;
                            return `${nameWithoutExt.substring(
                              0,
                              maxNameLength,
                            )}...${extension}`;
                          })()
                        : file.name}
                    </div>
                    <div className="text-xs text-gray-500">PDF Document</div>
                  </div>
                </div>
              ) : (
                <img
                  src={photo}
                  alt="Receipt preview"
                  className="max-w-full h-32 object-contain mx-auto rounded"
                />
              ))}
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 mx-auto mb-2" />
            <span className="text-sm block">
              Click to upload or drag and drop a receipt image
            </span>
            <span className="text-xs text-gray-400 mt-1">
              Supports JPG, PNG, GIF, PDF
            </span>
          </>
        )}
        <input
          id="file-upload"
          type="file"
          accept="image/*,.pdf"
          onChange={async (e) =>
            await handleFileSelect(e.target.files?.[0] || null)
          }
          className="hidden"
        />
      </div>

      <Button onClick={onParseWithLLM} isEnabled={Boolean(file && !loading)}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          'Parse purchase document'
        )}
      </Button>
    </Card>
  );
};

export default UploadForm;
