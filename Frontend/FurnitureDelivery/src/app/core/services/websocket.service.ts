import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { 
  WebSocketMessage, 
  StatusUpdateMessage, 
  LocationUpdateMessage,
  DriverAvailabilityMessage,
  DeliveryAssignmentMessage,
  NewMessageNotification
} from '../../models/furniture.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly socketUrl: string;
  private messagesSubject = new Subject<WebSocketMessage>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public messages$ = this.messagesSubject.asObservable();
  public connected$ = this.connectionStatus.asObservable();
  
  private reconnectTimer: any;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 5000; // 5 seconds
  
  constructor(private authService: AuthService) {
    // Determine if we're using secure WebSockets based on the protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the same host as the current window with /ws path
    const host = environment.production ? window.location.host : 'localhost:5000';
    this.socketUrl = `${protocol}//${host}/api/ws`;
    
    // Automatically connect if the user is already authenticated
    if (this.authService.isAuthenticated) {
      this.connect();
    }
    
    // Listen for authentication changes to connect/disconnect WebSocket
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }
  
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    try {
      // Get auth token to identify the user
      const authData = localStorage.getItem('auth_data');
      if (!authData) {
        console.error('No auth data found, cannot connect to WebSocket');
        return;
      }
      
      const { token } = JSON.parse(authData);
      const wsUrl = `${this.socketUrl}?token=${token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.connectionStatus.next(true);
        this.reconnectAttempts = 0;
        this.clearReconnectTimer();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.messagesSubject.next(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.connectionStatus.next(false);
        
        if (this.authService.isAuthenticated) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.connectionStatus.next(false);
    }
  }
  
  public disconnect(): void {
    this.clearReconnectTimer();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectionStatus.next(false);
    }
  }
  
  public send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  }
  
  // Helper to filter WebSocket messages by type
  public getMessages<T>(messageType: string): Observable<T> {
    return this.messages$.pipe(
      filter(message => message.type === messageType),
      map(message => message.data as T)
    );
  }
  
  // Convenience methods for specific message types
  public getStatusUpdates(): Observable<StatusUpdateMessage> {
    return this.getMessages<StatusUpdateMessage>('delivery_status_update');
  }
  
  public getLocationUpdates(): Observable<LocationUpdateMessage> {
    return this.getMessages<LocationUpdateMessage>('driver_location_update');
  }
  
  public getDriverAvailabilityUpdates(): Observable<DriverAvailabilityMessage> {
    return this.getMessages<DriverAvailabilityMessage>('driver_availability_update');
  }
  
  public getDeliveryAssignments(): Observable<DeliveryAssignmentMessage> {
    return this.getMessages<DeliveryAssignmentMessage>('delivery_assignment');
  }
  
  public getNewMessages(): Observable<NewMessageNotification> {
    return this.getMessages<NewMessageNotification>('new_message');
  }
  
  // Update driver location
  public updateDriverLocation(latitude: number, longitude: number, deliveryId?: number): void {
    this.send({
      type: 'driver_location_update',
      data: {
        latitude,
        longitude,
        deliveryId,
        updatedAt: new Date()
      }
    });
  }
  
  // Update driver availability
  public updateDriverAvailability(isAvailable: boolean): void {
    this.send({
      type: 'driver_availability_update',
      data: {
        isAvailable,
        updatedAt: new Date()
      }
    });
  }
  
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect in ${this.reconnectInterval / 1000} seconds...`);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached.`);
    }
  }
  
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}