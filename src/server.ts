import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { setupApiRoutes, setupWebSocketServer } from './api/routes';
import { errorConverter, errorHandler } from './api/middleware/error.middleware';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await app.prepare();

    const server = express();
    const httpServer = createServer(server);

    // Security middleware
    server.use(helmet());
    
    // CORS
    server.use(cors());
    
    // Compression
    server.use(compression());

    // Body parser middleware
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    // Debug logging middleware
    server.use((req, res, next) => {
      console.log('[Server] Incoming request:', req.method, req.url);
      next();
    });

    // Setup API routes
    setupApiRoutes(server);

    // Setup WebSocket server
    setupWebSocketServer(httpServer);

    // Error handling middleware
    server.use(errorConverter);
    server.use(errorHandler);

    // Let Next.js handle all other (frontend) routes
    server.all('*', (req, res) => {
      console.log('[Server] Forwarding to Next.js:', req.method, req.url);
      return handle(req, res);
    });

    // Start server
    httpServer.listen(port, () => {
      console.log(`> Server listening on http://localhost:${port}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
