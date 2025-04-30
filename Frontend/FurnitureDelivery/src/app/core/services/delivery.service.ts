import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Delivery, 
  DeliveryItem, 
  CreateDeliveryRequest, 
  UpdateDeliveryStatusRequest, 
  AssignDriverRequest, 
  Review, 
  CreateReviewRequest 
} from '../../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  constructor(private http: HttpClient) { }

  // Customer delivery operations
  getCustomerDeliveries(customerId: number): Observable<Delivery[]> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/customer/${customerId}`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('Get customer deliveries error', error);
          throw new Error(error.error?.message || 'Failed to get customer deliveries');
        })
      );
  }

  createDelivery(request: CreateDeliveryRequest): Observable<Delivery> {
    return this.http.post<any>(`${environment.apiUrl}/deliveries`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Create delivery error', error);
          throw new Error(error.error?.message || 'Failed to create delivery');
        })
      );
  }

  // Driver delivery operations
  getDriverDeliveries(driverId: number): Observable<Delivery[]> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/driver/${driverId}`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('Get driver deliveries error', error);
          throw new Error(error.error?.message || 'Failed to get driver deliveries');
        })
      );
  }

  getActiveDriverDeliveries(driverId: number): Observable<Delivery[]> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/driver/${driverId}/active`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error('Get active driver deliveries error', error);
          throw new Error(error.error?.message || 'Failed to get active driver deliveries');
        })
      );
  }

  // General delivery operations
  getDelivery(id: number): Observable<Delivery> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/${id}`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error(`Get delivery ${id} error`, error);
          throw new Error(error.error?.message || 'Failed to get delivery');
        })
      );
  }

  updateDeliveryStatus(id: number, request: UpdateDeliveryStatusRequest): Observable<Delivery> {
    return this.http.put<any>(`${environment.apiUrl}/deliveries/${id}/status`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error(`Update delivery ${id} status error`, error);
          throw new Error(error.error?.message || 'Failed to update delivery status');
        })
      );
  }

  assignDriverToDelivery(deliveryId: number, request: AssignDriverRequest): Observable<Delivery> {
    return this.http.put<any>(`${environment.apiUrl}/deliveries/${deliveryId}/assign`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error(`Assign driver to delivery ${deliveryId} error`, error);
          throw new Error(error.error?.message || 'Failed to assign driver to delivery');
        })
      );
  }

  // Item operations
  getDeliveryItems(deliveryId: number): Observable<DeliveryItem[]> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/${deliveryId}/items`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error(`Get delivery ${deliveryId} items error`, error);
          throw new Error(error.error?.message || 'Failed to get delivery items');
        })
      );
  }

  // Review operations
  getDriverReviews(driverId: number): Observable<Review[]> {
    return this.http.get<any>(`${environment.apiUrl}/reviews/driver/${driverId}`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          return [];
        }),
        catchError(error => {
          console.error(`Get driver ${driverId} reviews error`, error);
          throw new Error(error.error?.message || 'Failed to get driver reviews');
        })
      );
  }

  getDriverAverageRating(driverId: number): Observable<number> {
    return this.http.get<any>(`${environment.apiUrl}/reviews/driver/${driverId}/rating`)
      .pipe(
        map(response => {
          if (response && response.data !== undefined) {
            return response.data;
          }
          return 0;
        }),
        catchError(error => {
          console.error(`Get driver ${driverId} average rating error`, error);
          throw new Error(error.error?.message || 'Failed to get driver average rating');
        })
      );
  }

  createReview(request: CreateReviewRequest): Observable<Review> {
    return this.http.post<any>(`${environment.apiUrl}/reviews`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Create review error', error);
          throw new Error(error.error?.message || 'Failed to create review');
        })
      );
  }
}