import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DriverLocation } from '../models/driver.model';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private driverLocationSubject = new Subject<DriverLocation>();
  private deliveryStatusSubject = new Subject<{ deliveryId: number, status: string }>();
  private newMessageSubject = new Subject<{ message: any }>();

  constructor() { }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket) {
      return;
    }

    // Use the appropriate protocol based on HTTPS or HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        this.messageSubject.next(data);

        // Handle different message types
        switch (data.type) {
          case 'driver_location_update':
            this.driverLocationSubject.next({
              driverId: data.driverId,
              latitude: data.latitude,
              longitude: data.longitude,
              lastUpdated: new Date()
            });
            break;
            
          case 'delivery_status_update':
            this.deliveryStatusSubject.next({
              deliveryId: data.deliveryId,
              status: data.status
            });
            break;
            
          case 'new_message':
            this.newMessageSubject.next({
              message: data.message
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.socket = null;
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    };
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send a message through the WebSocket
   * @param message Message to send
   */
  send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Get all WebSocket messages as an Observable
   */
  getMessages(): Observable<WebSocketMessage> {
    return this.messageSubject.asObservable();
  }

  /**
   * Get driver location updates as an Observable
   */
  getDriverLocationUpdates(): Observable<DriverLocation> {
    return this.driverLocationSubject.asObservable();
  }

  /**
   * Get delivery status updates as an Observable
   */
  getDeliveryStatusUpdates(): Observable<{ deliveryId: number, status: string }> {
    return this.deliveryStatusSubject.asObservable();
  }

  /**
   * Get new messages as an Observable
   */
  getNewMessages(): Observable<{ message: any }> {
    return this.newMessageSubject.asObservable();
  }

  /**
   * Send a driver location update
   * @param driverId Driver ID
   * @param latitude Current latitude
   * @param longitude Current longitude
   */
  sendDriverLocationUpdate(driverId: number, latitude: number, longitude: number): void {
    this.send({
      type: 'driver_location_update',
      driverId,
      latitude,
      longitude
    });
  }

  /**
   * Send a delivery status update
   * @param deliveryId Delivery ID
   * @param status New status
   */
  sendDeliveryStatusUpdate(deliveryId: number, status: string): void {
    this.send({
      type: 'delivery_status_update',
      deliveryId,
      status
    });
  }

  /**
   * Send a new message
   * @param message Message object
   */
  sendNewMessage(message: any): void {
    this.send({
      type: 'new_message',
      message
    });
  }
}