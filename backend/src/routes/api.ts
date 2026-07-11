import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadCSV } from '../controllers/uploadController';
import { processRecords } from '../controllers/processController';

const router = Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file limit
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    apiMode: process.env.GEMINI_API_KEY ? 'AI-powered' : 'Local-fallback'
  });
});

// CSV Upload endpoint
router.post('/api/upload', upload.single('file'), uploadCSV);

// CSV batch processing endpoint
router.post('/api/process', processRecords);

export default router;
