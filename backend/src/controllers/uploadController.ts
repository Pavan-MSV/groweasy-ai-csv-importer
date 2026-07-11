import { Request, Response } from 'express';
import { parseCSVBuffer } from '../utils/csvParser';

export async function uploadCSV(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please upload a CSV file.' });
      return;
    }

    // Verify it looks like a CSV by extension or mimetype
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && req.file.mimetype !== 'text/csv') {
      res.status(400).json({ error: 'Invalid file format. Only CSV files are supported.' });
      return;
    }

    const { headers, rows } = await parseCSVBuffer(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'CSV file parsed successfully.',
      filename: req.file.originalname,
      rowCount: rows.length,
      headers,
      rows
    });
  } catch (error: any) {
    console.error('[UploadController] Error parsing CSV:', error);
    res.status(500).json({
      error: 'Failed to parse CSV file.',
      details: error.message || 'Unknown error'
    });
  }
}
