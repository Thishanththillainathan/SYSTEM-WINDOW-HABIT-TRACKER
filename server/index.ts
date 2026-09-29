import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE module imports so process.env is populated for all child modules
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb, pool } from './db';
import { seedAdmin } from './seed';
import { verifySmtpConnection } from './email';
import authRoutes from './routes/auth';
import userDataRoutes from './routes/userData';
import adminRoutes from './routes/admin';

// Startup Environment Variable Validation (NAMES ONLY - NO VALUES LOGGED)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]?.trim());

if (missingEnvVars.length > 0) {
  console.error(`❌ [STARTUP ERROR] Critical environment variables are missing: ${missingEnvVars.join(', ')}`);
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('❌ [FATAL] DATABASE_URL is not set. Cannot connect to production Neon database.');
    process.exit(1);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Enable proxy trust for Render / Cloudflare load balancers
app.set('trust proxy', 1);

// Exact hostname origin validation logic
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    // 1. Localhost and local loopback addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    ) {
      return true;
    }

    // 2. Exact match for configured FRONTEND_URL
    if (process.env.FRONTEND_URL?.trim()) {
      try {
        const frontendHost = new URL(process.env.FRONTEND_URL.trim()).hostname.toLowerCase();
        if (hostname === frontendHost) return true;
      } catch {}
    }

    // 3. Vercel production & preview deployments (*.vercel.app or vercel.app)
    if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) {
      return true;
    }

    // 4. In non-production environments allow dev requests
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
  } catch {}

  return false;
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [CORS BLOCKED] Request from unauthorized origin: ${origin}`);
      callback(new Error(`CORS Policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
};

// Apply CORS before all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Initialize DB and Seed Admin on Startup
initDb().catch((err) => {
  console.error('❌ [DATABASE INIT ERROR] Failed to initialize Neon PostgreSQL:', err);
});
seedAdmin().catch((err) => {
  console.error('❌ [ADMIN SEED ERROR] Failed to seed admin account:', err);
});
verifySmtpConnection().catch((err) => {
  console.error('❌ [SMTP CHECK ERROR] Failed to verify SMTP connection:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/admin', adminRoutes);

// Health check & Environment Diagnostic endpoint (Render compat)
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    envLoaded: true,
    smtpConfigured: Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()),
  });
});

// Safe registration diagnostics endpoint (NO SECRETS RETURNED)
app.get('/api/diagnostics/registration', async (req: Request, res: Response) => {
  let databaseStatus = 'configured';
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
  } catch (err: any) {
    databaseStatus = `error: ${err?.message || 'connection_failed'}`;
  }

  const smtpConfigured = Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  );

  res.json({
    database: databaseStatus,
    smtp: smtpConfigured ? 'configured' : 'missing',
    api: 'online',
  });
});

// 404 JSON Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Express Error Handler (ALWAYS RETURNS JSON WITH CORS HEADERS)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`❌ [UNHANDLED SERVER ERROR] ${req.method} ${req.originalUrl}:`, err?.stack || err?.message || err);

  // Attach CORS headers manually if error occurred before CORS middleware finished
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = err.statusCode || err.status || 500;
  const errorMsg = process.env.NODE_ENV === 'production'
    ? (err.isPublic ? err.message : 'Internal server error.')
    : (err.message || 'Internal Server Error');

  if (!res.headersSent) {
    res.status(statusCode).json({ error: errorMsg });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ [SYSTEM WINDOW BACKEND SERVER RUNNING]`);
  console.log(`➜  Port: ${PORT}`);
  console.log(`➜  Loaded .env Path: ${envPath}`);
  console.log(`\n[ENVIRONMENT DIAGNOSTICS]`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM?.trim() ? 'SET' : 'MISSING'}\n`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 [SYSTEM WINDOW BACKEND] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('⚡ [SYSTEM WINDOW BACKEND] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
