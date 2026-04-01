import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import compression from 'compression';

import { validateEnv, env } from './config/environment';
import { requestLogger } from '@middlewares/requestLogger';
import { errorHandler } from '@middlewares/errorHandler';
import { logger } from '@config/logger';


validateEnv();

const app = express();

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(cors({
  origin: env.allowedOrigins,
  credentials: true,
}));

// BODY PARSING & COOKIES
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));        
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// PARAMETER POLLUTION
app.use(hpp());

// COMPRESSION & LOGGING
app.use(compression());
app.use(requestLogger);

// HEALTH CHECK
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 HANDLER — must come after all routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist' },
  });
});

// GLOBAL ERROR HANDLER — must be last
app.use(errorHandler);

// PROCESS ERROR SAFETY NET
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

// SERVER BOOTSTRAP
const server = app.listen(env.port, () =>
  logger.info(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`)
);

export { server };
export default app;
