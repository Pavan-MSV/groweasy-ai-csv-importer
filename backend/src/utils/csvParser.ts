import csv from 'csv-parser';
import { Readable } from 'stream';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parses a CSV buffer and returns headers and rows.
 */
export function parseCSVBuffer(buffer: Buffer): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    let headers: string[] = [];

    const stream = Readable.from(buffer);
    
    stream
      .pipe(csv())
      .on('headers', (headerList: string[]) => {
        headers = headerList.map(h => h.trim());
      })
      .on('data', (data: any) => {
        // Clean keys and values
        const cleanRow: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          const cleanKey = key.trim();
          const cleanVal = typeof val === 'string' ? val.trim() : String(val).trim();
          cleanRow[cleanKey] = cleanVal;
        }
        results.push(cleanRow);
      })
      .on('end', () => {
        resolve({
          headers,
          rows: results
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}
