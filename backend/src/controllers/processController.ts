import { Request, Response } from 'express';
import { mapRecordsWithGemini } from '../services/geminiService';
import { CRMRecord } from '../services/localMapperService';

export async function processRecords(req: Request, res: Response): Promise<void> {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      res.status(400).json({ error: 'Invalid input. "records" must be an array of objects.' });
      return;
    }

    if (records.length === 0) {
      res.status(200).json({
        success: true,
        imported: [],
        skippedCount: 0,
        totalImported: 0,
        totalSkipped: 0,
        message: 'No records to process.'
      });
      return;
    }

    // Set headers for NDJSON streaming
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Avoids buffering in Nginx/Vercel proxies

    const batchSize = 25;
    const totalRecords = records.length;
    const totalBatches = Math.ceil(totalRecords / batchSize);
    
    const allImported: CRMRecord[] = [];
    let totalSkipped = 0;
    let geminiUsageCount = 0;
    let localUsageCount = 0;

    console.log(`[ProcessController] Starting processing of ${totalRecords} records in ${totalBatches} batches.`);

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalRecords);
      const batch = records.slice(startIdx, endIdx);

      // Call mapping service (which handles retry + local fallback)
      const result = await mapRecordsWithGemini(batch);

      allImported.push(...result.imported);
      totalSkipped += result.skippedCount;

      if (result.method === 'gemini') {
        geminiUsageCount++;
      } else {
        localUsageCount++;
      }

      // Write progress update chunk to response stream
      const progressChunk = {
        type: 'progress',
        batchIndex: i,
        totalBatches,
        processedCount: endIdx,
        totalRecords,
        currentImportedCount: result.imported.length,
        currentSkippedCount: result.skippedCount,
        method: result.method,
        error: result.error
      };

      res.write(JSON.stringify(progressChunk) + '\n');
      
      // Flush if flush method is available (some compression middlewares add res.flush)
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }

    // Final response summary chunk
    const finalChunk = {
      type: 'final',
      imported: allImported,
      totalImported: allImported.length,
      totalSkipped,
      totalProcessed: totalRecords,
      engineSummary: {
        geminiBatches: geminiUsageCount,
        localBatches: localUsageCount
      }
    };

    res.write(JSON.stringify(finalChunk) + '\n');
    res.end();

    console.log(`[ProcessController] Completed processing of ${totalRecords} records. Mapped: ${allImported.length}, Skipped: ${totalSkipped}`);

  } catch (error: any) {
    console.error('[ProcessController] Processing error:', error);
    // If headers have already been sent, we must close the stream
    if (res.headersSent) {
      res.write(JSON.stringify({ type: 'error', error: 'An error occurred during streaming processing.', details: error.message }) + '\n');
      res.end();
    } else {
      res.status(500).json({
        error: 'Failed to process records.',
        details: error.message || 'Unknown error'
      });
    }
  }
}
