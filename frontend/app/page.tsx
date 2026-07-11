'use client';

import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCsvImport } from '../hooks/useCsvImport';
import UploadStep from '../components/crm/UploadStep';
import PreviewStep from '../components/crm/PreviewStep';
import ImportingStep from '../components/crm/ImportingStep';
import ResultsStep from '../components/crm/ResultsStep';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function Home() {
  const {
    step,
    filename,
    headers,
    rows,
    importProgress,
    estimatedTimeRemaining,
    results,
    error,
    setError,
    serverMode,
    checkApiHealth,
    uploadFile,
    startImport,
    reset,
  } = useCsvImport();

  // Run backend health check on mount
  useEffect(() => {
    checkApiHealth();
  }, [checkApiHealth]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Navigation */}
      <header className="border-b border-border/20 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={reset}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
              GE
            </div>
            <span className="font-extrabold tracking-tight text-foreground text-lg flex items-center gap-1.5">
              GrowEasy <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">CRM Importer</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative subtle background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-5xl z-10 flex flex-col items-center">
          {/* Global Error Banner */}
          {error && step !== 'importing' && (
            <div className="mb-6 max-w-xl w-full flex items-start gap-3 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20 relative">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Import failed:</span> {error}
              </div>
              <button 
                onClick={() => setError(null)} 
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground font-semibold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Steps Switcher */}
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <UploadStep
                key="upload"
                onFileSelected={uploadFile}
                serverMode={serverMode}
              />
            )}

            {step === 'preview' && (
              <PreviewStep
                key="preview"
                filename={filename}
                headers={headers}
                rows={rows}
                onBack={reset}
                onConfirm={startImport}
              />
            )}

            {step === 'importing' && (
              <ImportingStep
                key="importing"
                importProgress={importProgress}
                estimatedTimeRemaining={estimatedTimeRemaining}
              />
            )}

            {step === 'results' && (
              <ResultsStep
                key="results"
                filename={filename}
                results={results}
                onReset={reset}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-border/20 py-6 text-center text-xs text-muted-foreground bg-background/30 backdrop-blur-sm">
        <p className="flex items-center justify-center gap-1">
          Made for <strong className="text-foreground/95">GrowEasy CRM</strong>. Powered by <Sparkles className="h-3 w-3 text-primary" /> Gemini 2.5.
        </p>
      </footer>
    </div>
  );
}
