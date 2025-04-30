import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Request } from 'express';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

interface WebSocketClient {
  socket: WebSocket;
  userId?: number;
  deliveryId?: number;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, WebSocketClient> = new Map();

  constructor(server: HttpServer) {
    // Initialize WebSocket server on a distinct path
    // to avoid conflicts with Vite's HMR websocket
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.setupWebSocketServer();
    console.log('WebSocket server initialized');
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (socket: WebSocket, request: Request) => {
      console.log('WebSocket client connected');
      
      // Store the client
      this.clients.set(socket, { socket });
      
      // Handle messages
      socket.on('message', (data: string) => {
        try {
          const message = JSON.parse(data) as WebSocketMessage;
          this.handleMessage(socket, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(socket: WebSocket, message: WebSocketMessage): void {
    const client = this.clients.get(socket);
    if (!client) return;
    
    switch (message.type) {
      case 'auth':
        // Authenticate the client
        if (message.payload.userId) {
          client.userId = message.payload.userId;
          console.log(`Client authenticated with userId: ${client.userId}`);
        }
        break;
        
      case 'subscribe_delivery':
        // Subscribe to delivery updates
        if (message.payload.deliveryId) {
          client.deliveryId = message.payload.deliveryId;
          console.log(`Client subscribed to deliveryId: ${client.deliveryId}`);
        }
        break;
        
      case 'driver_location':
        // Update driver location and broadcast to relevant clients
        if (message.payload.deliveryId && message.payload.latitude && message.payload.longitude) {
          this.broadcastToDelivery(message.payload.deliveryId, {
            type: 'delivery_location_update',
            payload: {
              deliveryId: message.payload.deliveryId,
              latitude: message.payload.latitude,
              longitude: message.payload.longitude,
              estimatedArrival: message.payload.estimatedArrival
            }
          });
        }
        break;
        
      case 'delivery_status':
        // Update delivery status and broadcast to relevant clients
        if (message.payload.deliveryId && message.payload.status) {
          this.broadcastToDelivery(message.payload.deliveryId, {
            type: 'delivery_status_update',
            payload: {
              deliveryId: message.payload.deliveryId,
              status: message.payload.status,
              estimatedArrival: message.payload.estimatedArrival
            }
          });
        }
        break;
        
      case 'chat_message':
        // Broadcast chat message to delivery participants
        if (message.payload.deliveryId && message.payload.message) {
          this.broadcastToDelivery(message.payload.deliveryId, {
            type: 'chat_message',
            payload: {
              deliveryId: message.payload.deliveryId,
              message: message.payload.message
            }
          });
        }
        break;
        
      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  }

  /**
   * Send a message to a specific user
   */
  public sendToUser(userId: number, message: WebSocketMessage): void {
    for (const client of this.clients.values()) {
      if (client.userId === userId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Broadcast a message to all clients subscribed to a specific delivery
   */
  public broadcastToDelivery(deliveryId: number, message: WebSocketMessage): void {
    for (const client of this.clients.values()) {
      if ((client.deliveryId === deliveryId || client.userId === message.payload.userId) && 
          client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Broadcast a message to all authenticated drivers
   */
  public broadcastToDrivers(message: WebSocketMessage): void {
    for (const client of this.clients.values()) {
      if (client.userId && client.socket.readyState === WebSocket.OPEN) {
        // In a real implementation, we would check if the user is a driver
        client.socket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: WebSocketMessage): void {
    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
}