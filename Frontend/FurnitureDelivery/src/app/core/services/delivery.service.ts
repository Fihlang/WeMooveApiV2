import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { WebSocketService } from './websocket.service';
import { Observable, tap } from 'rxjs';
import { 
  Delivery, 
  DeliveryWithItems, 
  CreateDeliveryRequest, 
  DeliveryItem 
} from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  constructor(
    private httpService: HttpService,
    private wsService: WebSocketService
  ) {}

  /**
   * Get a delivery by ID
   * @param deliveryId Delivery ID
   * @param detailed Whether to include detailed information
   */
  getDelivery(deliveryId: number, detailed: boolean = false): Observable<Delivery | DeliveryWithItems> {
    return this.httpService.get<Delivery | DeliveryWithItems>(
      `deliveries/${deliveryId}`, 
      { detailed: detailed.toString() }
    );
  }

  /**
   * Get all deliveries for a customer
   * @param customerId Customer ID
   */
  getCustomerDeliveries(customerId: number): Observable<Delivery[]> {
    return this.httpService.get<Delivery[]>(`customers/${customerId}/deliveries`);
  }

  /**
   * Get all deliveries for a driver
   * @param driverId Driver ID
   * @param activeOnly Whether to return only active deliveries
   */
  getDriverDeliveries(driverId: number, activeOnly: boolean = false): Observable<Delivery[]> {
    return this.httpService.get<Delivery[]>(
      `drivers/${driverId}/deliveries`,
      { active: activeOnly.toString() }
    );
  }

  /**
   * Create a new delivery
   * @param delivery Delivery data
   */
  createDelivery(delivery: CreateDeliveryRequest): Observable<DeliveryWithItems> {
    return this.httpService.post<DeliveryWithItems>('deliveries', delivery);
  }

  /**
   * Update a delivery's status
   * @param deliveryId Delivery ID
   * @param status New status
   */
  updateDeliveryStatus(deliveryId: number, status: string): Observable<Delivery> {
    return this.httpService.put<Delivery>(`deliveries/${deliveryId}/status`, { status }).pipe(
      tap(delivery => {
        // Send WebSocket update
        this.wsService.sendDeliveryStatusUpdate(deliveryId, status);
      })
    );
  }

  /**
   * Assign a driver to a delivery
   * @param deliveryId Delivery ID
   * @param driverId Driver ID
   */
  assignDriverToDelivery(deliveryId: number, driverId: number): Observable<Delivery> {
    return this.httpService.put<Delivery>(`deliveries/${deliveryId}/assign`, { driverId });
  }

  /**
   * Get items for a specific delivery
   * @param deliveryId Delivery ID
   */
  getDeliveryItems(deliveryId: number): Observable<DeliveryItem[]> {
    return this.httpService.get<DeliveryItem[]>(`deliveries/${deliveryId}/items`);
  }

  /**
   * Add an item to a delivery
   * @param item Delivery item data
   */
  addDeliveryItem(item: Partial<DeliveryItem>): Observable<DeliveryItem> {
    return this.httpService.post<DeliveryItem>('delivery-items', item);
  }

  /**
   * Subscribe to delivery status updates
   */
  getDeliveryStatusUpdates(): Observable<{ deliveryId: number, status: string }> {
    return this.wsService.getDeliveryStatusUpdates();
  }
}