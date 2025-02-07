import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { UserService } from './services/user.service';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const userService = new UserService();
const clients = new Map<string, AuthenticatedWebSocket>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', async (ws: AuthenticatedWebSocket, request) => {
    try {
      // Get token from query parameter
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      const user = await userService.findById(decoded.userId);

      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      // Set up connection
      ws.userId = user.id;
      ws.isAlive = true;
      clients.set(user.id, ws);

      // Handle ping/pong
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          // Handle different message types
          switch (data.type) {
            case 'audio':
              // Handle audio message
              break;
            case 'text':
              // Handle text message
              break;
            default:
              console.warn('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Message handling error:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Failed to process message' 
          }));
        }
      });

      // Handle close
      ws.on('close', () => {
        clients.delete(user.id);
      });

      // Send welcome message
      ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to DoveText server' 
      }));

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  // Set up heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        clients.delete(ws.userId!);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}
