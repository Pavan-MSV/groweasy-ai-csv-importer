import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, RefreshCw, FileJson, FileSpreadsheet, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { CRMRecord, FinalResult } from '../../types/import';

interface ResultsStepProps {
  filename: string;
  results: FinalResult | null;
  onReset: () => void;
}

export default function ResultsStep({ filename, results, onReset }: ResultsStepProps) {
  const [tab, setTab] = useState<'imported' | 'summary'>('imported');

  const defaultResults: FinalResult = {
    imported: [],
    totalImported: 0,
    totalSkipped: 0,
    totalProcessed: 0,
    engineSummary: { geminiBatches: 0, localBatches: 0 }
  };

  const activeResults = results || defaultResults;

  // Convert JSON to CSV for download
  const handleDownloadCSV = () => {
    if (activeResults.imported.length === 0) return;
    
    // CRM Schema columns as headers
    const headers = [
      'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
      'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
      'crm_note', 'data_source', 'possession_time', 'description'
    ];

    const csvRows = [headers.join(',')];

    for (const record of activeResults.imported) {
      const values = headers.map(header => {
        const val = record[header as keyof CRMRecord] || '';
        // Escape quotes and wrap in quotes
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_imported_${filename}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download JSON
  const handleDownloadJSON = () => {
    if (activeResults.imported.length === 0) return;

    const blob = new Blob([JSON.stringify(activeResults.imported, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_imported_${filename.replace(/\.csv$/i, '')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="glass-panel border-border/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Success header animation */}
        <div className="relative p-8 flex flex-col items-center justify-center border-b border-border/20 bg-muted/10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mb-4 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <CheckCircle2 className="h-10 w-10 shadow-[0_0_10px_#10b981]" />
          </motion.div>

          <h2 className="text-2xl font-extrabold tracking-tight glow-text">
            Import Sequence Completed
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
            Your file <strong>{filename}</strong> was parsed. Mapped records are now ready for CRM ingestion.
          </p>

          {/* Quick stats board */}
          <div className="flex gap-4 md:gap-8 mt-6">
            <div className="text-center px-4 py-2 border border-border/10 rounded-xl bg-background/30 min-w-[100px]">
              <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Total Rows</div>
              <div className="text-lg font-extrabold text-foreground">{activeResults.totalProcessed}</div>
            </div>
            <div className="text-center px-4 py-2 border border-border/10 rounded-xl bg-emerald-500/5 border-emerald-500/10 min-w-[100px]">
              <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-0.5">Imported</div>
              <div className="text-lg font-extrabold text-emerald-400">{activeResults.totalImported}</div>
            </div>
            <div className="text-center px-4 py-2 border border-border/10 rounded-xl bg-rose-500/5 border-rose-500/10 min-w-[100px]">
              <div className="text-[10px] text-rose-400/90 uppercase font-bold tracking-wider mb-0.5">Skipped</div>
              <div className="text-lg font-extrabold text-rose-400">{activeResults.totalSkipped}</div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border/20 px-6 bg-muted/5 justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setTab('imported')}
              className={`py-4 text-sm font-semibold border-b-2 px-1 transition-all ${
                tab === 'imported'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Imported Records ({activeResults.totalImported})
            </button>
            <button
              onClick={() => setTab('summary')}
              className={`py-4 text-sm font-semibold border-b-2 px-1 transition-all ${
                tab === 'summary'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Mapping Diagnostics
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              disabled={activeResults.totalImported === 0}
              className="h-9 px-3 rounded-lg text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJSON}
              disabled={activeResults.totalImported === 0}
              className="h-9 px-3 rounded-lg text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download JSON
            </Button>
          </div>
        </div>

        {/* Tab Contents */}
        <CardContent className="p-0 overflow-auto max-h-[40vh] flex-1">
          {tab === 'imported' ? (
            activeResults.imported.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                <p className="text-sm font-medium">All records skipped.</p>
                <p className="text-xs text-muted-foreground max-w-xs text-center mt-1">
                  Ensure input CSV rows contain at least an email or mobile phone number to pass CRM filters.
                </p>
              </div>
            ) : (
              <div className="relative">
                <Table className="border-collapse min-w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border/30">
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Name</TableHead>
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Email</TableHead>
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Phone</TableHead>
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Status</TableHead>
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Source</TableHead>
                      <TableHead className="py-3 text-xs font-semibold whitespace-nowrap">Notes Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeResults.imported.map((record, i) => (
                      <TableRow key={i} className="hover:bg-muted/10 border-b border-border/10">
                        <TableCell className="py-2.5 text-xs font-medium text-foreground">{record.name || '-'}</TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">{record.email || '-'}</TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                          {record.country_code ? `${record.country_code} ` : ''}
                          {record.mobile_without_country_code || '-'}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs">
                          {record.crm_status ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary uppercase">
                              {record.crm_status.replace(/_/g, ' ')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs">
                          {record.data_source ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted/80 text-foreground uppercase">
                              {record.data_source.replace(/_/g, ' ')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground truncate max-w-[200px]" title={record.crm_note}>
                          {record.crm_note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <div className="p-8 space-y-6 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">Mapping Success Rates</h4>
                  <p className="text-xs">
                    The files were batched in groups of 25 records. AI mapping automatically resolves columns, normalizes dates, filters statuses, and splits phone numbers/emails dynamically.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border/20 rounded-xl p-4 bg-background/25">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-violet-400" /> Gemini AI Batches
                  </h4>
                  <p className="text-2xl font-bold text-foreground">{activeResults.engineSummary.geminiBatches}</p>
                  <p className="text-xs text-muted-foreground mt-1">Processed using dynamic semantic mapping.</p>
                </div>
                <div className="border border-border/20 rounded-xl p-4 bg-background/25">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                    <FileJson className="h-4 w-4 text-amber-400" /> Local Engine Batches
                  </h4>
                  <p className="text-2xl font-bold text-foreground">{activeResults.engineSummary.localBatches}</p>
                  <p className="text-xs text-muted-foreground mt-1">Processed using fallback rules.</p>
                </div>
              </div>

              {activeResults.totalSkipped > 0 && (
                <div className="flex items-start space-x-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">Why were {activeResults.totalSkipped} records skipped?</h4>
                    <p className="text-xs">
                      GrowEasy CRM requires at least an <strong>email</strong> or a <strong>mobile number</strong> to create a contact. Any row in the CSV that did not resolve to either has been omitted to keep CRM directory integrity intact.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-6 border-t border-border/20 justify-center bg-muted/10">
          <Button onClick={onReset} className="font-bold flex items-center gap-2 glow-btn">
            <RefreshCw className="h-4 w-4" />
            Import Another CSV
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
