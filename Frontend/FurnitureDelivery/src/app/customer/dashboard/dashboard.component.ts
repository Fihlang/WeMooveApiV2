import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { DeliveryService } from '../../core/services/delivery.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { Delivery } from '../../models/delivery.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  deliveries: Delivery[] = [];
  loading = true;
  error: string | null = null;
  
  statusColors: { [key: string]: string } = {
    'pending': 'warning',
    'accepted': 'info',
    'picked_up': 'info',
    'in_transit': 'primary',
    'delivered': 'success',
    'cancelled': 'danger'
  };
  
  private subscriptions: Subscription[] = [];

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private websocketService: WebSocketService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.currentUserValue;
    
    // Load deliveries
    this.loadDeliveries();
    
    // Subscribe to delivery update notifications through WebSocket
    this.subscriptions.push(
      this.websocketService.getMessagesByType('delivery_update').subscribe(payload => {
        this.handleDeliveryUpdate(payload);
      })
    );
    
    // Ensure WebSocket connection is established
    if (!this.websocketService.isConnected()) {
      this.websocketService.connect();
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDeliveries(): void {
    this.loading = true;
    this.error = null;
    
    this.subscriptions.push(
      this.deliveryService.getMyDeliveries().subscribe({
        next: (deliveries) => {
          this.deliveries = deliveries;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching deliveries:', error);
          this.error = 'Failed to load your deliveries. Please try again.';
          this.loading = false;
        }
      })
    );
  }

  trackDelivery(deliveryId: number): void {
    this.router.navigate(['/customer/track', deliveryId]);
  }

  placeNewOrder(): void {
    this.router.navigate(['/customer/place-order']);
  }

  browseCatalog(): void {
    this.router.navigate(['/customer/catalog']);
  }

  getStatusClass(status: string): string {
    return this.statusColors[status] || 'secondary';
  }

  private handleDeliveryUpdate(payload: any): void {
    // Find and update the delivery in the list
    const index = this.deliveries.findIndex(d => d.id === payload.deliveryId);
    
    if (index !== -1) {
      // Update the delivery with the new data
      this.deliveries[index] = {
        ...this.deliveries[index],
        ...payload.delivery
      };
    } else if (payload.customerId === this.currentUser?.id) {
      // If it's a new delivery for this customer, add it to the list
      this.deliveries.push(payload.delivery);
    }
  }
}