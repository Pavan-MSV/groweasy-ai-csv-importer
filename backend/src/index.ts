import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection (Next.js is typically on 3000)
app.use(cors({
  origin: '*', // For production, specify your Vercel domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health and API routes
app.use('/', apiRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GlobalErrorHandler]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred on the server.',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 GrowEasy CRM Importer Backend running on port ${PORT}`);
  console.log(`🔧 Mode: ${process.env.GEMINI_API_KEY ? 'AI-POWERED (Gemini)' : 'LOCAL-FALLBACK (Synonym Matching)'}`);
  console.log(`==================================================`);
});

export default app;
