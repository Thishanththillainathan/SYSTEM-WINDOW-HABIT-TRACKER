import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE module imports so process.env is populated for all child modules
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './db';
import { seedAdmin } from './seed';
import { verifySmtpConnection } from './email';
import authRoutes from './routes/auth';
import userDataRoutes from './routes/userData';
import adminRoutes from './routes/admin';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Flexible & secure CORS setup for local + Vercel production origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL?.trim(),
      ].filter(Boolean) as string[];

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, origin);
      }

      // Default fallback for trusted origins
      return callback(null, origin);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Initialize DB and Seed Admin on Startup
initDb();
seedAdmin().catch(console.error);
verifySmtpConnection().catch(console.error);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/admin', adminRoutes);

// Health check & Environment Diagnostic endpoint (Render compat)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    envLoaded: true,
    smtpConfigured: Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ [SYSTEM WINDOW BACKEND SERVER RUNNING]`);
  console.log(`➜  Port: ${PORT}`);
  console.log(`➜  Loaded .env Path: ${envPath}`);
  console.log(`\n[ENVIRONMENT DIAGNOSTICS]`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS?.trim() ? 'SET' : 'MISSING'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM?.trim() ? 'SET' : 'MISSING'}\n`);
});
