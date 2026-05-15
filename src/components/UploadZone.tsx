import { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.eml')) {
        onFileSelect(file);
      } else {
        alert("Please upload a valid .eml file.");
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-300",
        isDragging ? "border-accent-cyan bg-accent-cyan/10" : "border-border-color bg-bg-panel hover:border-text-muted hover:bg-bg-panel/80",
        isLoading ? "opacity-50 pointer-events-none" : ""
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".eml" 
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center justify-center p-6 text-center">
        {isLoading ? (
          <div className="w-12 h-12 mb-4 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin" />
        ) : (
          <UploadCloud className="w-12 h-12 mb-4 text-accent-cyan opacity-80" />
        )}
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {isLoading ? "Parsing EML..." : "Upload EML File"}
        </h3>
        <p className="text-sm text-text-muted max-w-sm">
          Drag and drop your .eml file here, or click to browse. Analysis is performed entirely in your browser.
        </p>
      </div>
    </div>
  );
}
