import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Delivery, DeliveryWithItems } from '../../models/delivery.model';
import { DeliveryItem } from '../../models/delivery-item.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}/deliveries`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all deliveries for the current user based on their role
   */
  public getMyDeliveries(): Observable<Delivery[]> {
    const userId = this.authService.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    // Endpoint varies based on user type
    const endpoint = this.authService.isDriver 
      ? `${this.apiUrl}/driver/${userId}` 
      : `${this.apiUrl}/customer/${userId}`;
    
    return this.http.get<Delivery[]>(endpoint)
      .pipe(
        catchError(error => {
          console.error('Error fetching deliveries:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get active deliveries for the current driver
   */
  public getActiveDeliveries(): Observable<Delivery[]> {
    if (!this.authService.isDriver) {
      return throwError(() => new Error('Only drivers can access active deliveries'));
    }
    
    const userId = this.authService.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    return this.http.get<Delivery[]>(`${this.apiUrl}/driver/${userId}/active`)
      .pipe(
        catchError(error => {
          console.error('Error fetching active deliveries:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get a specific delivery with its items
   * @param deliveryId ID of the delivery to retrieve
   */
  public getDelivery(deliveryId: number): Observable<DeliveryWithItems> {
    return this.http.get<DeliveryWithItems>(`${this.apiUrl}/${deliveryId}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching delivery ${deliveryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Create a new delivery
   * @param deliveryData Delivery data
   */
  public createDelivery(deliveryData: any): Observable<Delivery> {
    const userId = this.authService.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    // Ensure customer ID is set
    const data = {
      ...deliveryData,
      customerId: userId
    };
    
    return this.http.post<Delivery>(this.apiUrl, data)
      .pipe(
        catchError(error => {
          console.error('Error creating delivery:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update the status of a delivery
   * @param deliveryId ID of the delivery to update
   * @param status New status value
   */
  public updateDeliveryStatus(deliveryId: number, status: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.apiUrl}/${deliveryId}/status`, { status })
      .pipe(
        catchError(error => {
          console.error(`Error updating delivery ${deliveryId} status:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Assign a driver to a delivery
   * @param deliveryId ID of the delivery
   * @param driverId ID of the driver to assign
   */
  public assignDriver(deliveryId: number, driverId: number): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.apiUrl}/${deliveryId}/assign`, { driverId })
      .pipe(
        catchError(error => {
          console.error(`Error assigning driver to delivery ${deliveryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update driver location for an active delivery
   * @param deliveryId ID of the delivery
   * @param latitude Current latitude
   * @param longitude Current longitude
   */
  public updateDriverLocation(deliveryId: number, latitude: number, longitude: number): Observable<Delivery> {
    if (!this.authService.isDriver) {
      return throwError(() => new Error('Only drivers can update location'));
    }
    
    return this.http.patch<Delivery>(`${this.apiUrl}/${deliveryId}/location`, { 
      latitude, 
      longitude 
    }).pipe(
      catchError(error => {
        console.error(`Error updating location for delivery ${deliveryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add items to a delivery
   * @param deliveryId ID of the delivery
   * @param items Array of delivery items to add
   */
  public addDeliveryItems(deliveryId: number, items: Partial<DeliveryItem>[]): Observable<DeliveryItem[]> {
    return this.http.post<DeliveryItem[]>(`${this.apiUrl}/${deliveryId}/items`, { items })
      .pipe(
        catchError(error => {
          console.error(`Error adding items to delivery ${deliveryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Remove an item from a delivery
   * @param deliveryId ID of the delivery
   * @param itemId ID of the item to remove
   */
  public removeDeliveryItem(deliveryId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${deliveryId}/items/${itemId}`)
      .pipe(
        catchError(error => {
          console.error(`Error removing item ${itemId} from delivery ${deliveryId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Calculate delivery price based on items, distance, etc.
   * @param deliveryData Delivery calculation data
   */
  public calculateDeliveryPrice(deliveryData: any): Observable<{ totalPrice: number }> {
    return this.http.post<{ totalPrice: number }>(`${this.apiUrl}/calculate-price`, deliveryData)
      .pipe(
        catchError(error => {
          console.error('Error calculating delivery price:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Find nearby drivers for pickup
   * @param latitude Pickup latitude
   * @param longitude Pickup longitude
   * @param radius Search radius in kilometers
   */
  public findNearbyDrivers(latitude: number, longitude: number, radius: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/drivers/nearby`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString()
      }
    }).pipe(
      catchError(error => {
        console.error('Error finding nearby drivers:', error);
        return throwError(() => error);
      })
    );
  }
}