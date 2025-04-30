import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { HttpService } from '../../core/services/http.service';
import { AuthService, User } from '../../core/services/auth.service';

interface DeliverySummary {
  id: number;
  status: string;
  createdAt: Date;
  scheduledDate: Date;
  pickupAddress: string;
  destinationAddress: string;
  totalPrice: number;
  driverName?: string;
}

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule
  ]
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  recentDeliveries: DeliverySummary[] = [];
  activeDeliveries: DeliverySummary[] = [];
  pendingActions: number = 0;
  
  deliveryStatusMap: { [key: string]: { icon: string, color: string } } = {
    'pending': { icon: 'schedule', color: '#FFA000' },
    'confirmed': { icon: 'check_circle', color: '#2196F3' },
    'in_transit': { icon: 'local_shipping', color: '#4CAF50' },
    'delivered': { icon: 'done_all', color: '#4CAF50' },
    'cancelled': { icon: 'cancel', color: '#F44336' }
  };

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadActiveDeliveries();
    this.loadRecentDeliveries();
  }

  loadActiveDeliveries(): void {
    if (!this.currentUser) return;
    
    this.httpService.get<DeliverySummary[]>(`customers/${this.currentUser.id}/deliveries/active`)
      .subscribe({
        next: (deliveries) => {
          this.activeDeliveries = deliveries;
          
          // Count deliveries that need customer action
          this.pendingActions = deliveries.filter(d => 
            d.status === 'pending_payment' || 
            d.status === 'pending_review' || 
            d.status === 'awaiting_confirmation'
          ).length;
        },
        error: (error) => {
          console.error('Error loading active deliveries:', error);
        }
      });
  }

  loadRecentDeliveries(): void {
    if (!this.currentUser) return;
    
    this.httpService.get<DeliverySummary[]>(`customers/${this.currentUser.id}/deliveries/recent`)
      .subscribe({
        next: (deliveries) => {
          this.recentDeliveries = deliveries;
        },
        error: (error) => {
          console.error('Error loading recent deliveries:', error);
        }
      });
  }

  getStatusInfo(status: string): { icon: string, color: string } {
    return this.deliveryStatusMap[status] || { icon: 'help', color: '#757575' };
  }

  formatAddress(address: string): string {
    return address.length > 30 ? address.substring(0, 27) + '...' : address;
  }
}