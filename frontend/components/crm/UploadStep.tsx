import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  serverMode: 'AI-powered' | 'Local-fallback' | 'unknown';
}

export default function UploadStep({ onFileSelected, serverMode }: UploadStepProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setLocalError(null);
    
    if (rejectedFiles.length > 0) {
      setLocalError('Invalid file type. Please upload a valid CSV file.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Size check: E.g., limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        setLocalError('File size is too large. Maximum supported size is 10MB.');
        return;
      }
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass-panel overflow-hidden border-border/80 shadow-2xl relative">
          {/* Glowing subtle top bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-primary to-indigo-500" />
          
          <CardContent className="p-8 flex flex-col items-center justify-center">
            {/* Top Icon / Header */}
            <div className="mb-6 flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 glow-btn">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-center glow-text">
              GrowEasy CRM Importer
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-sm">
              Upload leads from any CRM, campaign, or sheet. AI mappings will align them into GrowEasy schema.
            </p>

            {/* Dropzone Container */}
            <div
              {...getRootProps()}
              className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-primary bg-primary/5 scale-102'
                  : 'border-border hover:border-primary/40 hover:bg-muted/10'
              }`}
            >
              <input {...getInputProps()} />
              
              <UploadCloud className={`h-12 w-12 mb-4 transition-colors ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`} />

              <p className="text-sm font-semibold mb-1 text-center">
                {isDragActive ? 'Drop your CSV file here' : 'Drag & Drop CSV file here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4 text-center">
                or click to browse local files
              </p>

              <div className="flex items-center space-x-2 text-xs text-muted-foreground border border-border/40 px-3 py-1.5 rounded-full bg-background/30">
                <FileText className="h-3 w-3" />
                <span>Supported format: .csv (Max 10MB)</span>
              </div>
            </div>

            {/* Error Message */}
            {localError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center space-x-2 text-xs text-destructive bg-destructive/10 px-4 py-2.5 rounded-xl border border-destructive/20 w-full"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{localError}</span>
              </motion.div>
            )}

            {/* Status Information */}
            <div className="mt-8 border-t border-border/20 pt-6 w-full flex justify-between items-center text-xs text-muted-foreground">
              <span>Mapping Engine Status:</span>
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  serverMode === 'AI-powered' 
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                    : serverMode === 'Local-fallback'
                    ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-zinc-500'
                }`} />
                <span className="font-semibold text-foreground/90 capitalize">
                  {serverMode === 'AI-powered' ? 'Gemini AI Mode' : 'Local Rule Engine'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
