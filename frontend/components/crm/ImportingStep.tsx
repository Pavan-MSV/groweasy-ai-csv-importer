import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, Sparkles, Clock, AlertTriangle, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface ImportingStepProps {
  importProgress: {
    batchIndex: number;
    totalBatches: number;
    processedCount: number;
    totalRecords: number;
    currentImportedCount: number;
    currentSkippedCount: number;
    method: 'gemini' | 'local';
    error?: string;
  } | null;
  estimatedTimeRemaining: number | null;
}

export default function ImportingStep({ importProgress, estimatedTimeRemaining }: ImportingStepProps) {
  const percentage = useMemo(() => {
    if (!importProgress || importProgress.totalRecords === 0) return 0;
    return Math.round((importProgress.processedCount / importProgress.totalRecords) * 100);
  }, [importProgress]);

  const formattedTimeRemaining = useMemo(() => {
    if (estimatedTimeRemaining === null) return 'Calculating...';
    if (estimatedTimeRemaining <= 0) return 'Almost done...';
    
    const minutes = Math.floor(estimatedTimeRemaining / 60);
    const seconds = estimatedTimeRemaining % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [estimatedTimeRemaining]);

  if (!importProgress) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Initializing import sequence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
      >
        <Card className="glass-panel overflow-hidden border-border/80 shadow-2xl relative">
          {/* Animated top progress beam */}
          <div 
            className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-violet-500 via-primary to-indigo-400 transition-all duration-300 ease-out" 
            style={{ width: `${percentage}%` }}
          />

          <CardHeader className="pb-4 items-center">
            {/* Spinning Loader / AI Sparkle Hybrid */}
            <div className="relative mb-4 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center glow-btn"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {importProgress.method === 'gemini' ? (
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                ) : (
                  <Database className="h-6 w-6 text-amber-400 animate-pulse" />
                )}
              </div>
            </div>

            <CardTitle className="text-xl font-extrabold text-center tracking-tight glow-text">
              Importing Records...
            </CardTitle>
            <p className="text-xs text-muted-foreground text-center max-w-sm mt-1">
              Please do not close this browser tab. Processing batches of 25 records sequentially.
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Progress Metrics */}
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-primary">{percentage}%</span>
            </div>

            <Progress value={percentage} className="h-2.5" />

            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Processed Count */}
              <div className="border border-border/20 rounded-xl p-3 bg-background/25 flex flex-col justify-center items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Processed</span>
                <span className="text-base font-bold text-foreground">
                  {importProgress.processedCount} / {importProgress.totalRecords}
                </span>
              </div>

              {/* Time Remaining */}
              <div className="border border-border/20 rounded-xl p-3 bg-background/25 flex flex-col justify-center items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time Remaining
                </span>
                <span className="text-base font-bold text-foreground">
                  {formattedTimeRemaining}
                </span>
              </div>
            </div>

            {/* Batch Status Logs */}
            <div className="border border-border/20 rounded-xl p-4 bg-black/40 font-mono text-xs text-left h-28 overflow-y-auto space-y-1.5 scrollbar-thin">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>[LOG] import_initializer initialized...</span>
                <span>OK</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>[INFO] Batch size configured to 25</span>
                <span>OK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary">
                  [SYS] Processing Batch {importProgress.batchIndex + 1} of {importProgress.totalBatches}
                </span>
                <span className="text-primary animate-pulse">Running</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>[ENG] Engine type in use:</span>
                <span className={importProgress.method === 'gemini' ? 'text-violet-400' : 'text-amber-400'}>
                  {importProgress.method === 'gemini' ? 'Google Gemini AI' : 'Local Fallback'}
                </span>
              </div>
              
              <AnimatePresence>
                {importProgress.error && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-destructive flex items-start gap-1"
                  >
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>[WARN] Batch Error: {importProgress.error}. Retrying/Skipping...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Extra status indicators */}
            <div className="flex justify-between items-center text-xs border-t border-border/20 pt-4 px-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Imported: <strong className="text-foreground">{importProgress.currentImportedCount}</strong></span>
              </div>
              <div>
                <span>Skipped: <strong className="text-foreground">{importProgress.currentSkippedCount}</strong></span>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
