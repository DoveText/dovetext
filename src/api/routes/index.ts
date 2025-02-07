import express from 'express';
import authRoutes from './auth';
import versionRoutes from './version';
import waitlistRoutes from './waitlist';
import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { setupWebSocket } from '../websocket';

export function setupApiRoutes(app: express.Application) {
  console.log('[API] Setting up API routes');
  const apiRouter = express.Router();

  // Debug middleware for API routes
  apiRouter.use((req, res, next) => {
    console.log('[API Router] Handling request:', req.method, req.baseUrl + req.url);
    next();
  });

  // API routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/version', versionRoutes);
  apiRouter.use('/waitlist', waitlistRoutes);

  // Mount API router
  app.use('/api', apiRouter);
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWebSocket(wss);
}
