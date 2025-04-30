import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket!: WebSocket;
  private subjects = new Map<string, Subject<any>>();
  private messageQueue: WebSocketMessage[] = [];
  private connectionEstablished$ = new BehaviorSubject<boolean>(false);
  private clientId: string | null = null;

  constructor(private authService: AuthService) {
    this.connect();
    
    // Reconnect if authentication state changes
    this.authService.currentUser$.subscribe(user => {
      if (user && this.connectionEstablished$.value) {
        this.authenticate(user.id, user.userType);
      }
    });
  }

  public connect(): void {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return;
    }
    
    // Build WebSocket URL using the same protocol (http/https -> ws/wss) and host as the current page
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = (event) => {
      console.log('WebSocket connection established');
      this.connectionEstablished$.next(true);
      
      // Send any queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.sendMessage(message);
        }
      }
      
      // Authenticate if user is logged in
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          this.authenticate(user.id, user.userType);
        }
      });
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        // Store clientId if this is a connection message
        if (message.type === 'connected' && message.clientId) {
          this.clientId = message.clientId;
        }
        
        // Dispatch message to appropriate subject
        const subject = this.getSubject(message.type);
        subject.next(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      this.connectionEstablished$.next(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(), 5000);
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private authenticate(userId: number, userType: string): void {
    const authMessage: WebSocketMessage = {
      type: 'authenticate',
      userId,
      userType
    };
    
    // If user is a driver, they might have a driverId to send
    if (userType === 'driver') {
      // In a real app, we'd get the driver's ID from their profile
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser.driverId) {
        authMessage.driverId = currentUser.driverId;
      }
    }
    
    this.sendMessage(authMessage);
  }

  private getSubject(type: string): Subject<any> {
    if (!this.subjects.has(type)) {
      this.subjects.set(type, new Subject<any>());
    }
    return this.subjects.get(type)!;
  }

  public on<T>(type: string): Observable<T> {
    return this.getSubject('message').pipe(
      filter((message: WebSocketMessage) => message.type === type),
      map((message: WebSocketMessage) => message as unknown as T)
    );
  }

  public sendMessage(message: WebSocketMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }
    
    this.socket.send(JSON.stringify(message));
  }

  public isConnected(): Observable<boolean> {
    return this.connectionEstablished$.asObservable();
  }

  // Helper methods for common message types
  
  public updateDriverLocation(driverId: number, deliveryId: number, latitude: number, longitude: number): void {
    this.sendMessage({
      type: 'driver_location_update',
      driverId,
      deliveryId,
      latitude,
      longitude
    });
  }
  
  public updateDeliveryStatus(deliveryId: number, status: string): void {
    this.sendMessage({
      type: 'delivery_status_update',
      deliveryId,
      status
    });
  }
  
  public sendChatMessage(deliveryId: number, senderId: number, content: string): void {
    this.sendMessage({
      type: 'new_message',
      message: {
        deliveryId,
        senderId,
        content,
        timestamp: new Date()
      }
    });
  }
}