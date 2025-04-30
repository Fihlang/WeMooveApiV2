import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpService } from '../../core/services/http.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const google: any;

interface DeliveryDetails {
  id: number;
  status: string;
  createdAt: Date;
  scheduledDate: Date;
  pickupAddress: string;
  destinationAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  totalPrice: number;
  driverId: number | null;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  currentLatitude?: number;
  currentLongitude?: number;
  estimatedArrival?: Date;
  statusUpdates: StatusUpdate[];
  items: DeliveryItem[];
}

interface StatusUpdate {
  status: string;
  timestamp: Date;
  note?: string;
}

interface DeliveryItem {
  id: number;
  name: string;
  quantity: number;
  specialHandling: boolean;
}

@Component({
  selector: 'app-delivery-tracking',
  templateUrl: './delivery-tracking.component.html',
  styleUrls: ['./delivery-tracking.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatStepperModule,
    MatProgressBarModule
  ]
})
export class DeliveryTrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  deliveryId!: number;
  delivery: DeliveryDetails | null = null;
  loading = true;
  error = '';
  map: any;
  driverMarker: any;
  pickupMarker: any;
  destinationMarker: any;
  deliveryPath: any;
  mapInitialized = false;
  
  private subscriptions = new Subscription();
  
  // Delivery progress statuses in order
  readonly deliveryStatuses = [
    'pending',
    'confirmed',
    'driver_assigned',
    'driver_en_route_to_pickup',
    'at_pickup',
    'loading',
    'in_transit',
    'approaching_destination',
    'delivered',
    'completed'
  ];
  
  // Status icon mapping
  readonly statusIcons: { [key: string]: string } = {
    'pending': 'schedule',
    'confirmed': 'check_circle',
    'driver_assigned': 'person',
    'driver_en_route_to_pickup': 'directions_car',
    'at_pickup': 'store',
    'loading': 'local_shipping',
    'in_transit': 'local_shipping',
    'approaching_destination': 'home',
    'delivered': 'done_all',
    'completed': 'verified',
    'cancelled': 'cancel'
  };

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.deliveryId = +params['id'];
      this.loadDeliveryDetails();
    });
    
    // Subscribe to WebSocket updates for this delivery
    this.subscribeToDeliveryUpdates();
  }
  
  ngAfterViewInit(): void {
    // If the delivery data is already loaded, initialize the map
    if (this.delivery && !this.mapInitialized) {
      this.initializeMap();
    }
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadDeliveryDetails(): void {
    this.loading = true;
    this.httpService.get<DeliveryDetails>(`deliveries/${this.deliveryId}`)
      .subscribe({
        next: (delivery) => {
          this.delivery = delivery;
          this.loading = false;
          
          // Initialize the map if the view is ready
          if (this.mapContainer && !this.mapInitialized) {
            this.initializeMap();
          }
        },
        error: (error) => {
          this.error = error.message;
          this.loading = false;
        }
      });
  }
  
  subscribeToDeliveryUpdates(): void {
    const locationUpdateSubscription = this.webSocketService.on<any>('driver_location_update')
      .subscribe(update => {
        if (update.deliveryId === this.deliveryId && this.delivery) {
          // Update driver location on the delivery object
          this.delivery.currentLatitude = update.latitude;
          this.delivery.currentLongitude = update.longitude;
          
          // Update the marker on the map
          if (this.driverMarker && this.mapInitialized) {
            const newPosition = new google.maps.LatLng(update.latitude, update.longitude);
            this.driverMarker.setPosition(newPosition);
            
            // Center the map on the driver's position
            this.map.panTo(newPosition);
            
            // Update the path
            this.updateDeliveryPath();
          }
        }
      });
      
    const statusUpdateSubscription = this.webSocketService.on<any>('delivery_status_update')
      .subscribe(update => {
        if (update.deliveryId === this.deliveryId && this.delivery) {
          // Update the delivery status
          this.delivery.status = update.status;
          
          // Add to status updates
          this.delivery.statusUpdates.push({
            status: update.status,
            timestamp: new Date(update.timestamp),
            note: update.note
          });
          
          // Sort status updates by timestamp
          this.delivery.statusUpdates.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      });
    
    this.subscriptions.add(locationUpdateSubscription);
    this.subscriptions.add(statusUpdateSubscription);
  }
  
  initializeMap(): void {
    if (!this.delivery || !this.mapContainer || !environment.googleMapsApiKey) {
      return;
    }
    
    // Initial center point - either driver location, pickup, or destination
    const center = this.getMapCenter();
    
    // Map options
    const mapOptions = {
      center,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    };
    
    // Create the map
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    
    // Add markers
    this.addMapMarkers();
    
    // Draw the path between points
    this.updateDeliveryPath();
    
    this.mapInitialized = true;
  }
  
  getMapCenter(): any {
    if (this.delivery) {
      // If driver location is available, center on that
      if (this.delivery.currentLatitude && this.delivery.currentLongitude) {
        return new google.maps.LatLng(
          this.delivery.currentLatitude, 
          this.delivery.currentLongitude
        );
      }
      
      // If we're still at or before pickup, center on pickup location
      if (this.isBeforeStatus('in_transit')) {
        return new google.maps.LatLng(
          this.delivery.pickupLatitude, 
          this.delivery.pickupLongitude
        );
      }
      
      // Otherwise center on destination
      return new google.maps.LatLng(
        this.delivery.destinationLatitude, 
        this.delivery.destinationLongitude
      );
    }
    
    // Fallback to a default center if no delivery
    return new google.maps.LatLng(0, 0);
  }
  
  addMapMarkers(): void {
    if (!this.delivery || !this.map) return;
    
    // Add pickup marker
    this.pickupMarker = new google.maps.Marker({
      position: new google.maps.LatLng(
        this.delivery.pickupLatitude, 
        this.delivery.pickupLongitude
      ),
      map: this.map,
      title: 'Pickup Location',
      icon: {
        url: 'assets/images/pickup-marker.png',
        scaledSize: new google.maps.Size(40, 40)
      }
    });
    
    // Add destination marker
    this.destinationMarker = new google.maps.Marker({
      position: new google.maps.LatLng(
        this.delivery.destinationLatitude, 
        this.delivery.destinationLongitude
      ),
      map: this.map,
      title: 'Destination',
      icon: {
        url: 'assets/images/destination-marker.png',
        scaledSize: new google.maps.Size(40, 40)
      }
    });
    
    // Add driver marker if driver is assigned and location is available
    if (
      this.delivery.driverId && 
      this.delivery.currentLatitude && 
      this.delivery.currentLongitude
    ) {
      this.driverMarker = new google.maps.Marker({
        position: new google.maps.LatLng(
          this.delivery.currentLatitude, 
          this.delivery.currentLongitude
        ),
        map: this.map,
        title: this.delivery.driverName || 'Driver',
        icon: {
          url: 'assets/images/truck-marker.png',
          scaledSize: new google.maps.Size(50, 50)
        }
      });
    }
  }
  
  updateDeliveryPath(): void {
    if (!this.delivery || !this.map) return;
    
    // Remove existing path if it exists
    if (this.deliveryPath) {
      this.deliveryPath.setMap(null);
    }
    
    const path = [];
    
    // If driver has a current location, add it to the path
    if (
      this.delivery.currentLatitude && 
      this.delivery.currentLongitude
    ) {
      path.push(new google.maps.LatLng(
        this.delivery.currentLatitude, 
        this.delivery.currentLongitude
      ));
    }
    
    // If we're before or at pickup, add pickup to path
    if (this.isBeforeStatus('in_transit')) {
      path.push(new google.maps.LatLng(
        this.delivery.pickupLatitude, 
        this.delivery.pickupLongitude
      ));
    }
    
    // Always add destination to path
    path.push(new google.maps.LatLng(
      this.delivery.destinationLatitude, 
      this.delivery.destinationLongitude
    ));
    
    // Create the path
    this.deliveryPath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    
    this.deliveryPath.setMap(this.map);
  }
  
  getCurrentStatusIndex(): number {
    if (!this.delivery) return 0;
    return this.deliveryStatuses.indexOf(this.delivery.status);
  }
  
  isBeforeStatus(status: string): boolean {
    if (!this.delivery) return false;
    
    const currentIndex = this.deliveryStatuses.indexOf(this.delivery.status);
    const targetIndex = this.deliveryStatuses.indexOf(status);
    
    return currentIndex < targetIndex;
  }
  
  getStatusCompletionPercentage(): number {
    if (!this.delivery) return 0;
    
    const currentIndex = this.getCurrentStatusIndex();
    if (currentIndex < 0) return 0;
    
    return (currentIndex / (this.deliveryStatuses.length - 1)) * 100;
  }
  
  getStatusIcon(status: string): string {
    return this.statusIcons[status] || 'help';
  }
  
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  }
  
  openChat(): void {
    // Implement chat functionality
    console.log('Open chat with driver');
  }
  
  callDriver(): void {
    if (this.delivery?.driverPhone) {
      window.open(`tel:${this.delivery.driverPhone}`);
    }
  }
}