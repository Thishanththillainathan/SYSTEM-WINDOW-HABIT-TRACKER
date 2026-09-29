import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'admin' | 'customer';
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'system_window_shadow_monarch_jwt_secret_2026_x9';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
});

export function generateToken(payload: { userId: string; email: string; role: 'admin' | 'customer' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyTokenMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Authentication required. No session token provided.',
      message: 'Authentication required. No session token provided.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: 'admin' | 'customer';
    };

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      error: 'Invalid or expired session token. Please log in again.',
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

export function requireAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      error: 'Access denied. Administrator clearance required.',
      message: 'Access denied. Administrator clearance required.'
    });
    return;
  }
  next();
}
