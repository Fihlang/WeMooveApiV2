import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface LocationUpdateMessage extends WebSocketMessage {
  type: 'driver_location_update';
  driverId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface DeliveryStatusUpdateMessage extends WebSocketMessage {
  type: 'delivery_status_update';
  deliveryId: number;
  status: string;
  timestamp: Date;
}

export interface NewMessageMessage extends WebSocketMessage {
  type: 'new_message';
  message: {
    id: number;
    senderId: number;
    senderType: string;
    deliveryId: number;
    content: string;
    createdAt: Date;
    isRead: boolean;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  // Connection status
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();
  
  // Authentication status with the WebSocket server
  private authenticatedSubject = new BehaviorSubject<boolean>(false);
  public authenticated$ = this.authenticatedSubject.asObservable();
  
  // WebSocket messages stream
  private messagesSubject = new Subject<WebSocketMessage>();
  public messages$ = this.messagesSubject.asObservable();
  
  // Client ID assigned by the server
  private clientId: string | null = null;
  
  // WebSocket instance
  private socket: WebSocket | null = null;
  
  // Cleanup subject
  private destroy$ = new Subject<void>();
  
  // Reconnection settings
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private reconnectTimeoutId: any = null;
  
  constructor(private authService: AuthService) {
    // Subscribe to auth changes to connect/disconnect
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.connect();
        } else {
          this.disconnect();
        }
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    // Determine WebSocket protocol based on current HTTP protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);
    
    // Set up event handlers
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.socket) {
      // Remove event handlers to avoid memory leaks
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      // Close the connection if it's open
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.connectedSubject.next(false);
    this.authenticatedSubject.next(false);
    this.clientId = null;
  }
  
  /**
   * Send a message to the WebSocket server
   */
  send(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }
    
    this.socket.send(JSON.stringify(message));
  }
  
  /**
   * Authenticate with the WebSocket server
   */
  authenticate(userId: number, userType: string, driverId?: number): void {
    this.send({
      type: 'authenticate',
      userId,
      userType,
      driverId
    });
  }
  
  /**
   * Update driver location
   */
  updateDriverLocation(driverId: number, deliveryId: number, latitude: number, longitude: number): void {
    this.send({
      type: 'driver_location_update',
      driverId,
      deliveryId,
      latitude,
      longitude
    });
  }
  
  /**
   * Update delivery status
   */
  updateDeliveryStatus(deliveryId: number, status: string): void {
    this.send({
      type: 'delivery_status_update',
      deliveryId,
      status
    });
  }
  
  /**
   * Send a new message
   */
  sendMessage(message: {
    senderId: number;
    senderType: string;
    deliveryId: number;
    content: string;
  }): void {
    this.send({
      type: 'new_message',
      message
    });
  }
  
  /**
   * Get messages of a specific type
   */
  getMessagesByType<T extends WebSocketMessage>(type: string): Observable<T> {
    return this.messages$.pipe(
      filter(message => message.type === type),
      map(message => message as T)
    );
  }
  
  /**
   * Get driver location updates for a specific driver
   */
  getDriverLocationUpdates(driverId: number): Observable<LocationUpdateMessage> {
    return this.getMessagesByType<LocationUpdateMessage>('driver_location_update').pipe(
      filter(message => message.driverId === driverId)
    );
  }
  
  /**
   * Get delivery status updates for a specific delivery
   */
  getDeliveryStatusUpdates(deliveryId: number): Observable<DeliveryStatusUpdateMessage> {
    return this.getMessagesByType<DeliveryStatusUpdateMessage>('delivery_status_update').pipe(
      filter(message => message.deliveryId === deliveryId)
    );
  }
  
  /**
   * Get messages for a specific delivery
   */
  getDeliveryMessages(deliveryId: number): Observable<NewMessageMessage> {
    return this.getMessagesByType<NewMessageMessage>('new_message').pipe(
      filter(message => message.message.deliveryId === deliveryId)
    );
  }
  
  // WebSocket event handlers
  private onOpen(event: Event): void {
    console.log('WebSocket connected');
    this.connectedSubject.next(true);
    this.reconnectAttempts = 0;
  }
  
  private onMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log('Received WebSocket message:', message);
      
      // Handle different message types
      switch (message.type) {
        case 'connected':
          // Store client ID
          this.clientId = message.clientId;
          // If user is logged in, authenticate with the WebSocket server
          const user = this.authService.currentUserValue;
          if (user) {
            this.authenticate(
              user.id, 
              user.userType, 
              user.userType === 'driver' ? user.id : undefined
            );
          }
          break;
          
        case 'authenticated':
          this.authenticatedSubject.next(true);
          break;
          
        default:
          // Forward all messages to the messages subject
          this.messagesSubject.next(message);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  private onClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.connectedSubject.next(false);
    this.authenticatedSubject.next(false);
    
    // Attempt to reconnect unless connection was closed deliberately
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }
  
  private onError(event: Event): void {
    console.error('WebSocket error:', event);
  }
}