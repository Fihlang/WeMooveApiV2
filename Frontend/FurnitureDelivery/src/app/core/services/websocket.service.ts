import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SocketMessage {
  type: string;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<SocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private reconnectTimeoutId: any;
  private manualDisconnect = false;

  constructor(private authService: AuthService) {
    // Automatically connect to WebSocket if user is already authenticated
    if (this.authService.isAuthenticated) {
      this.connect();
    }

    // Subscribe to auth changes to connect/disconnect socket
    this.authService.authStatusChange.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.connect();
      } else {
        this.disconnect(true);
      }
    });
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    // Don't connect if already connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't connect if not authenticated
    if (!this.authService.isAuthenticated) {
      console.error('Cannot connect to WebSocket: User not authenticated');
      return;
    }

    this.manualDisconnect = false;
    
    // Get userId and token for authentication
    const userId = this.authService.currentUserValue?.id;
    const token = this.authService.getAuthToken();
    
    if (!userId || !token) {
      console.error('Cannot connect to WebSocket: Missing user ID or token');
      return;
    }

    try {
      // Determine WebSocket protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const baseUrl = environment.apiUrl.replace(/^https?:\/\//, '');
      
      // Connect with authentication parameters
      this.socket = new WebSocket(`${protocol}//${baseUrl}/ws?userId=${userId}&token=${token}`);
      
      this.socket.onopen = this.onOpen.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onclose = this.onClose.bind(this);
      this.socket.onerror = this.onError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   * @param manual Whether the disconnect was manually initiated
   */
  public disconnect(manual: boolean = false): void {
    this.manualDisconnect = manual;
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear any pending reconnect
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param payload Message payload
   */
  public send(type: string, payload: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        type,
        payload
      });
      
      this.socket.send(message);
    } else {
      console.error('Cannot send message: WebSocket is not connected');
      
      // Try to reconnect if not manually disconnected
      if (!this.manualDisconnect) {
        this.connect();
      }
    }
  }

  /**
   * Get an observable of WebSocket messages
   */
  public getMessages(): Observable<SocketMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Get a filtered observable of WebSocket messages by type
   * @param type Message type to filter by
   */
  public getMessagesByType(type: string): Observable<any> {
    return new Observable(observer => {
      const subscription = this.messageSubject.subscribe(
        message => {
          if (message.type === type) {
            observer.next(message.payload);
          }
        },
        error => observer.error(error),
        () => observer.complete()
      );
      
      return () => {
        subscription.unsubscribe();
      };
    });
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  // WebSocket event handlers
  private onOpen(event: Event): void {
    console.log('WebSocket connection established');
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
  }

  private onMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as SocketMessage;
      this.messageSubject.next(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private onClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    // Attempt to reconnect unless manually disconnected
    if (!this.manualDisconnect && this.authService.isAuthenticated) {
      this.attemptReconnect();
    }
  }

  private onError(event: Event): void {
    console.error('WebSocket error:', event);
    
    // The WebSocket will close automatically after an error
    // The onClose handler will handle reconnection
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Set timeout for reconnect
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Maximum WebSocket reconnect attempts reached');
    }
  }
}