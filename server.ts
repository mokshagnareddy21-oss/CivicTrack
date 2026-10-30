import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { connectDB, isDbConnected, getDatabaseStatus } from './src/server/db.ts';
import { authRouter } from './src/server/routes/auth.ts';
import { complaintsRouter } from './src/server/routes/complaints.ts';
import { analyticsRouter } from './src/server/routes/analytics.ts';
import { healthRouter } from './src/server/routes/health.ts';


// If running in container environment with /app/.dev.env.json, load missing env keys
try {
  const devEnvPath = '/app/.dev.env.json';
  if (fs.existsSync(devEnvPath)) {
    const devEnv = JSON.parse(fs.readFileSync(devEnvPath, 'utf-8'));
    for (const [key, value] of Object.entries(devEnv)) {
      if (!process.env[key] && typeof value === 'string') {
        process.env[key] = value;
      }
    }
  }
} catch {
  // Ignore fallback error
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Mandatory Environment Variable Checks
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
    console.error('================================================================================');
    console.error('🚨 [CivicTrack Fatal] JWT_SECRET environment variable is missing.');
    console.error('================================================================================');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim().length === 0) {
    console.error('================================================================================');
    console.error('🚨 [CivicTrack Fatal] MONGODB_URI environment variable is missing.');
    console.error('================================================================================');
    process.exit(1);
  }

  const app = express();

  // Trust reverse proxy (Google Cloud Run / Load Balancer / Vite)
  app.set('trust proxy', 1);

  // Core middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initiate MongoDB Atlas Connection asynchronously (with background auto-retry)
  connectDB().catch((err) => {
    console.warn('[CivicTrack] Initial Atlas handshake delayed:', err.message);
  });

  // Health and System Status Endpoint (Always reachable)
  app.use('/api/health', healthRouter);

  // Database Connection Guard for API Mutations
  // If MongoDB Atlas is still authenticating or waiting for IP whitelist, inform the client gracefully
  const dbGuard = (req: Request, res: Response, next: NextFunction): void => {
    if (!isDbConnected()) {
      const status = getDatabaseStatus();
      res.status(503).json({
        success: false,
        message:
          'Database connecting to MongoDB Atlas cluster... If this persists, please ensure your IP address is whitelisted in MongoDB Atlas (Security -> Network Access -> Add IP Address: 0.0.0.0/0).',
        databaseStatus: status.statusText,
        error: status.lastError,
      });
      return;
    }
    next();
  };

  // REST API Routes with Database Guard
  app.use('/api/auth', dbGuard, authRouter);
  app.use('/api/complaints', dbGuard, complaintsRouter);
  app.use('/api/analytics', dbGuard, analyticsRouter);

  // Global API 404 handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.url}' not found on CivicTrack server.`,
    });
  });

  // Global API error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[CivicTrack Unhandled Error]:', err.message || err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An internal server error occurred. Please try again.',
    });
  });

  // Frontend integration: Vite middleware in development, static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Start HTTP dev server on Port 3000
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`=======================================================`);
    console.log(`🏛️ CivicTrack Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`🗄️ Database: MongoDB Atlas (Mongoose ODM)`);
    console.log(`=======================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[CivicTrack] Port ${PORT} busy, retrying in 1s...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('[CivicTrack Server Listen Error]:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('[CivicTrack] Fatal error starting server:', err);
  process.exit(1);
});
