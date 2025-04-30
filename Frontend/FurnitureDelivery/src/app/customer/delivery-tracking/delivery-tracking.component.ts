import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { DeliveryService } from '../../core/services/delivery.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Delivery } from '../../models/delivery.model';
import { DeliveryItem } from '../../models/delivery-item.model';
import { Driver } from '../../models/driver.model';

@Component({
  selector: 'app-delivery-tracking',
  templateUrl: './delivery-tracking.component.html',
  styleUrls: ['./delivery-tracking.component.css']
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy {
  deliveryId: number | null = null;
  delivery: Delivery | null = null;
  deliveryItems: DeliveryItem[] = [];
  driver: Driver | null = null;
  loading = true;
  error: string | null = null;
  
  // Chat functionality
  messages: any[] = [];
  newMessage: string = '';
  
  private subscriptions: Subscription[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService,
    private websocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    // Get delivery ID from route params
    this.route.params.subscribe(params => {
      this.deliveryId = +params['id']; // Convert to number
      this.loadDeliveryDetails();
    });
    
    // Subscribe to real-time updates
    this.subscriptions.push(
      this.websocketService.getMessagesByType('delivery_location_update').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleLocationUpdate(payload);
        }
      })
    );
    
    this.subscriptions.push(
      this.websocketService.getMessagesByType('delivery_status_update').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleStatusUpdate(payload);
        }
      })
    );
    
    this.subscriptions.push(
      this.websocketService.getMessagesByType('chat_message').subscribe(payload => {
        if (payload.deliveryId === this.deliveryId) {
          this.handleNewMessage(payload);
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDeliveryDetails(): void {
    if (!this.deliveryId) return;
    
    this.loading = true;
    this.error = null;
    
    // Load full delivery details with items
    this.subscriptions.push(
      this.deliveryService.getDeliveryWithItems(this.deliveryId).subscribe({
        next: (response) => {
          this.delivery = response.delivery;
          this.deliveryItems = response.items;
          
          // If driver is assigned, get driver details
          if (this.delivery?.driverId) {
            this.loadDriverDetails(this.delivery.driverId);
          }
          
          // Load chat history
          this.loadChatHistory();
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching delivery details:', error);
          this.error = 'Failed to load delivery information. Please try again.';
          this.loading = false;
        }
      })
    );
  }

  loadDriverDetails(driverId: number): void {
    this.subscriptions.push(
      this.deliveryService.getDriverDetails(driverId).subscribe({
        next: (driver) => {
          this.driver = driver;
        },
        error: (error) => {
          console.error('Error fetching driver details:', error);
        }
      })
    );
  }

  loadChatHistory(): void {
    if (!this.deliveryId) return;
    
    this.subscriptions.push(
      this.deliveryService.getChatMessages(this.deliveryId).subscribe({
        next: (messages) => {
          this.messages = messages;
        },
        error: (error) => {
          console.error('Error fetching chat history:', error);
        }
      })
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.deliveryId) return;
    
    this.subscriptions.push(
      this.deliveryService.sendChatMessage(this.deliveryId, this.newMessage).subscribe({
        next: (_) => {
          // Message successfully sent to the server (the websocket will bring it back)
          this.newMessage = '';
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      })
    );
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'warning',
      'accepted': 'info',
      'picked_up': 'info',
      'in_transit': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    
    return statusMap[status] || 'secondary';
  }

  private handleLocationUpdate(payload: any): void {
    if (this.delivery && this.driver) {
      // Update driver's location
      this.driver.currentLatitude = payload.latitude;
      this.driver.currentLongitude = payload.longitude;
      
      // Update ETA if provided
      if (payload.estimatedArrival) {
        this.delivery.estimatedArrival = payload.estimatedArrival;
      }
    }
  }

  private handleStatusUpdate(payload: any): void {
    if (this.delivery) {
      // Update delivery status
      this.delivery.status = payload.status;
      
      // Update other fields if provided
      if (payload.estimatedArrival) {
        this.delivery.estimatedArrival = payload.estimatedArrival;
      }
    }
  }

  private handleNewMessage(payload: any): void {
    // Add the new message to the message list
    this.messages.push(payload.message);
  }
}