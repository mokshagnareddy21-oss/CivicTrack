import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret || rawJwtSecret.trim().length === 0) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing. Server cannot start.');
}
export const JWT_SECRET: string = rawJwtSecret.trim();

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'citizen' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim().length === 0) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Malformed authentication token.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Please sign in again.',
    });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required to access administrator features.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required to perform this action.',
    });
    return;
  }

  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
        req.user = decoded;
      } catch {
        // Silently continue for optional authentication
      }
    }
  }
  next();
}

// Rate Limiter for Authentication Endpoints (Brute-force protection)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  },
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Rate Limiter for Public Tracking Endpoint (Anti-scraping)
export const trackingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 tracking queries per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  },
  message: {
    success: false,
    message: 'Too many grievance tracking requests from this IP. Please slow down and try again shortly.',
  },
});
