interface WebSocketMessage {
  type: string;
  payload: any;
}

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnected = false;
  private userId: number | null = null;
  private userType: string | null = null;
  private isAuthenticated = false;
  private deliverySubscriptions: Set<number> = new Set();
  
  constructor() {
    // Bind methods to this instance
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.authenticate = this.authenticate.bind(this);
    this.subscribeToDelivery = this.subscribeToDelivery.bind(this);
    this.unsubscribeFromDelivery = this.unsubscribeFromDelivery.bind(this);
    this.handleSocketOpen = this.handleSocketOpen.bind(this);
    this.handleSocketClose = this.handleSocketClose.bind(this);
    this.handleSocketError = this.handleSocketError.bind(this);
  }
  
  /**
   * Connect to the WebSocket server
   * @returns {boolean} Whether connection was initiated
   */
  public connect(): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already connected');
      return true;
    }
    
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket: Connection in progress');
      return true;
    }
    
    try {
      // Determine the WebSocket URL based on current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up event listeners
      this.socket.onopen = this.handleSocketOpen;
      this.socket.onclose = this.handleSocketClose;
      this.socket.onerror = this.handleSocketError;
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket: Failed to parse message', error);
        }
      };
      
      return true;
    } catch (error) {
      console.error('WebSocket: Connection error', error);
      this.scheduleReconnect();
      return false;
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
    
    this.isConnected = false;
    this.isAuthenticated = false;
  }
  
  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param payload Message payload
   * @returns Whether message was sent
   */
  public send(type: string, payload: any = {}): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket: Not connected, message not sent');
      // Try to reconnect
      this.connect();
      return false;
    }
    
    try {
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('WebSocket: Error sending message', error);
      return false;
    }
  }
  
  /**
   * Register a handler for a specific message type
   * @param type Message type to listen for
   * @param handler Handler function
   * @returns Function to remove the handler
   */
  public on(type: string, handler: MessageHandler): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }
    
    this.eventHandlers.get(type)!.add(handler);
    
    // Return a function to remove this handler
    return () => {
      this.off(type, handler);
    };
  }
  
  /**
   * Remove a handler for a specific message type
   * @param type Message type
   * @param handler Handler function to remove
   */
  public off(type: string, handler: MessageHandler): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }
  
  /**
   * Authenticate with the WebSocket server
   * @param userId User ID
   * @param userType User type (customer, driver, admin)
   * @returns Whether authentication message was sent
   */
  public authenticate(userId: number, userType: string): boolean {
    this.userId = userId;
    this.userType = userType;
    
    // If already connected, send auth message right away
    if (this.isConnected) {
      return this.sendAuthMessage();
    }
    
    // Otherwise, authentication will happen when connection is established
    return true;
  }
  
  /**
   * Subscribe to updates for a specific delivery
   * @param deliveryId Delivery ID to subscribe to
   * @returns Whether subscription message was sent
   */
  public subscribeToDelivery(deliveryId: number): boolean {
    this.deliverySubscriptions.add(deliveryId);
    
    if (this.isConnected && this.isAuthenticated) {
      return this.send('subscribe_delivery', { deliveryId });
    }
    
    return true;
  }
  
  /**
   * Unsubscribe from updates for a specific delivery
   * @param deliveryId Delivery ID to unsubscribe from
   * @returns Whether unsubscription message was sent
   */
  public unsubscribeFromDelivery(deliveryId: number): boolean {
    this.deliverySubscriptions.delete(deliveryId);
    
    if (this.isConnected && this.isAuthenticated) {
      return this.send('unsubscribe_delivery', { deliveryId });
    }
    
    return true;
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param message The message received
   */
  private handleMessage(message: WebSocketMessage): void {
    // Call all registered handlers for this message type
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error(`WebSocket: Error in handler for ${message.type}`, error);
        }
      });
    }
    
    // Handle authentication response
    if (message.type === 'auth_response') {
      this.isAuthenticated = message.payload.success;
      
      if (this.isAuthenticated) {
        console.log('WebSocket: Authenticated successfully');
        
        // Re-subscribe to deliveries
        this.deliverySubscriptions.forEach(deliveryId => {
          this.subscribeToDelivery(deliveryId);
        });
      } else {
        console.error('WebSocket: Authentication failed', message.payload.error);
      }
    }
  }
  
  /**
   * Handle WebSocket connection open
   */
  private handleSocketOpen(): void {
    console.log('WebSocket: Connected');
    this.isConnected = true;
    
    // Send authentication if we have user info
    if (this.userId && this.userType) {
      this.sendAuthMessage();
    }
    
    // Clear reconnect timer if it exists
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  /**
   * Handle WebSocket connection close
   * @param event Close event
   */
  private handleSocketClose(event: CloseEvent): void {
    this.isConnected = false;
    this.isAuthenticated = false;
    console.log(`WebSocket: Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    
    // Schedule reconnection
    this.scheduleReconnect();
  }
  
  /**
   * Handle WebSocket connection error
   * @param event Error event
   */
  private handleSocketError(event: Event): void {
    console.error('WebSocket: Error', event);
  }
  
  /**
   * Send authentication message to the server
   * @returns Whether message was sent
   */
  private sendAuthMessage(): boolean {
    return this.send('authenticate', {
      userId: this.userId,
      userType: this.userType
    });
  }
  
  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log('WebSocket: Attempting to reconnect...');
      this.connect();
    }, 5000); // Retry after 5 seconds
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();