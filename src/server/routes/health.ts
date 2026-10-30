import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDatabaseStatus, connectDB } from '../db.ts';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: dbStatus.isConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'CivicTrack Public Grievance Tracker API',
    version: '1.0.0',
    database: {
      status: dbStatus.statusText,
      isConnected: dbStatus.isConnected,
      engine: 'MongoDB Atlas',
      databaseName: dbStatus.databaseName,
      host: dbStatus.host,
      lastError: dbStatus.lastError,
      troubleshooting: dbStatus.troubleshooting,
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

healthRouter.post('/retry', async (_req: Request, res: Response) => {
  await connectDB().catch(() => {});
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    success: dbStatus.isConnected,
    status: dbStatus.isConnected ? 'healthy' : 'degraded',
    database: {
      status: dbStatus.statusText,
      isConnected: dbStatus.isConnected,
      engine: 'MongoDB Atlas',
      databaseName: dbStatus.databaseName,
      host: dbStatus.host,
      lastError: dbStatus.lastError,
      troubleshooting: dbStatus.troubleshooting,
    },
  });
});
