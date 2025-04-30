// WebSocket Service for Furniture Delivery App
// This service manages the WebSocket connection to the server and handles messages

import { toast } from "@/hooks/use-toast";

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 3000; // milliseconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private handlers: Map<string, ((payload: any) => void)[]> = new Map();
  private userId: number | null = null;
  private userType: string | null = null;
  private driverId: number | null = null;
  private subscribedDeliveryId: number | null = null;

  constructor() {
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return true;
    }

    try {
      // Determine the correct WebSocket URL based on the current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * Set up event listeners for the WebSocket connection
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      
      // If we have user credentials, authenticate immediately
      if (this.userId) {
        this.authenticate(this.userId, this.userType || 'customer', this.driverId);
      }
      
      // If we were subscribed to a delivery, resubscribe
      if (this.subscribedDeliveryId) {
        this.subscribeToDelivery(this.subscribedDeliveryId);
      }
      
      // Notify listeners that connection is established
      this.notifyHandlers('connected', { connected: true });
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      this.notifyHandlers('disconnected', { code: event.code, reason: event.reason });
      
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyHandlers('error', { error });
    };
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      this.notifyHandlers('reconnect_failed', { attempts: this.maxReconnectAttempts });
      
      // Show a toast notification to the user
      toast({
        title: "Connection Lost",
        description: "Could not reconnect to the server. Please refresh the page.",
        variant: "destructive",
      });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(type: string, payload: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }

    try {
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('Received WebSocket message:', message);
    
    // Handle system messages
    switch (message.type) {
      case 'connected':
      case 'authenticated':
        // These are handled by the respective event handlers
        break;
        
      case 'error':
        console.error('Server error:', message.payload);
        toast({
          title: "Server Error",
          description: message.payload.message || "An error occurred",
          variant: "destructive",
        });
        break;
    }
    
    // Notify registered handlers for this message type
    this.notifyHandlers(message.type, message.payload);
  }

  /**
   * Notify handlers for a specific message type
   */
  private notifyHandlers(type: string, payload: any): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in handler for message type ${type}:`, error);
        }
      });
    }
  }

  /**
   * Register a handler for a specific message type
   */
  public on(type: string, handler: (payload: any) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)!.push(handler);
    
    // Return a function to remove this handler
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Authenticate the user with the WebSocket server
   */
  public authenticate(userId: number, userType: string = 'customer', driverId?: number): boolean {
    this.userId = userId;
    this.userType = userType;
    this.driverId = driverId || null;
    
    return this.send('authenticate', {
      userId,
      userType,
      ...(driverId ? { driverId } : {})
    });
  }

  /**
   * Subscribe to updates for a specific delivery
   */
  public subscribeToDelivery(deliveryId: number): boolean {
    this.subscribedDeliveryId = deliveryId;
    return this.send('subscribe_delivery', { deliveryId });
  }

  /**
   * Update the driver's location
   */
  public updateDriverLocation(driverId: number, deliveryId: number, latitude: number, longitude: number): boolean {
    return this.send('driver_location_update', {
      driverId,
      deliveryId,
      latitude,
      longitude
    });
  }

  /**
   * Update a delivery's status
   */
  public updateDeliveryStatus(deliveryId: number, status: string): boolean {
    return this.send('delivery_status_update', {
      deliveryId,
      status
    });
  }

  /**
   * Send a message in a delivery chat
   */
  public sendMessage(deliveryId: number, senderId: number, message: string): boolean {
    return this.send('send_message', {
      deliveryId,
      senderId,
      message
    });
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();