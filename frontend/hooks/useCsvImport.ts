import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { CRMRecord, ImportStep, ProgressState, FinalResult } from '../types/import';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useCsvImport() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [filename, setFilename] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [importProgress, setImportProgress] = useState<ProgressState | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null); // in seconds
  const [results, setResults] = useState<FinalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverMode, setServerMode] = useState<'AI-powered' | 'Local-fallback' | 'unknown'>('unknown');

  const startTimeRef = useRef<number>(0);

  // Check health and mode of the backend API
  const checkApiHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        setServerMode(data.apiMode === 'AI-powered' ? 'AI-powered' : 'Local-fallback');
      } else {
        setServerMode('Local-fallback'); // Default to local-fallback on error
      }
    } catch (err) {
      console.warn('[useCsvImport] Backend health check failed, falling back to local mapper client-side or offline modes.');
      setServerMode('Local-fallback');
    }
  }, []);

  // Parse CSV client-side using PapaParse
  const uploadFile = useCallback((file: File) => {
    setError(null);
    setFilename(file.name);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('[PapaParse] Errors during parsing:', results.errors);
        }

        const parsedHeaders = results.meta.fields || [];
        const parsedRows = results.data as Record<string, string>[];

        if (parsedHeaders.length === 0 || parsedRows.length === 0) {
          setError('The uploaded CSV file appears to be empty or malformed.');
          return;
        }

        setHeaders(parsedHeaders);
        setRows(parsedRows);
        setStep('preview');
      },
      error: (err) => {
        console.error('[PapaParse] Parse error:', err);
        setError(`Failed to read file: ${err.message}`);
      }
    });
  }, []);

  // Run the batch import using NDJSON streaming
  const startImport = useCallback(async () => {
    setError(null);
    setStep('importing');
    setImportProgress({
      batchIndex: 0,
      totalBatches: Math.ceil(rows.length / 25),
      processedCount: 0,
      totalRecords: rows.length,
      currentImportedCount: 0,
      currentSkippedCount: 0,
      method: 'local'
    });
    setResults(null);
    startTimeRef.current = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: rows }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming is not supported by your browser or connection.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete block in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line);

            if (chunk.type === 'progress') {
              setImportProgress({
                batchIndex: chunk.batchIndex,
                totalBatches: chunk.totalBatches,
                processedCount: chunk.processedCount,
                totalRecords: chunk.totalRecords,
                currentImportedCount: chunk.currentImportedCount,
                currentSkippedCount: chunk.currentSkippedCount,
                method: chunk.method,
                error: chunk.error
              });

              // Calculate remaining time
              const elapsedMs = Date.now() - startTimeRef.current;
              const completedBatches = chunk.batchIndex + 1;
              const totalBatches = chunk.totalBatches;
              
              if (completedBatches < totalBatches) {
                const avgBatchTimeMs = elapsedMs / completedBatches;
                const remainingBatches = totalBatches - completedBatches;
                const remainingSeconds = Math.ceil((remainingBatches * avgBatchTimeMs) / 1000);
                setEstimatedTimeRemaining(remainingSeconds);
              } else {
                setEstimatedTimeRemaining(0);
              }
            } else if (chunk.type === 'final') {
              setResults({
                imported: chunk.imported,
                totalImported: chunk.totalImported,
                totalSkipped: chunk.totalSkipped,
                totalProcessed: chunk.totalProcessed,
                engineSummary: chunk.engineSummary
              });
              setStep('results');
            } else if (chunk.type === 'error') {
              throw new Error(chunk.error || 'A processing error occurred on the backend.');
            }
          } catch (e: any) {
            console.error('[Stream Parsing Error]:', e);
            throw new Error(`Streaming parse failure: ${e.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error('[Import Error]:', err);
      setError(err.message || 'An error occurred while importing your records.');
      setStep('preview');
    }
  }, [rows]);

  const reset = useCallback(() => {
    setStep('upload');
    setFilename('');
    setHeaders([]);
    setRows([]);
    setImportProgress(null);
    setEstimatedTimeRemaining(null);
    setResults(null);
    setError(null);
  }, []);

  return {
    step,
    setStep,
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
    reset
  };
}
