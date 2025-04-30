import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule
  ]
})
export class HeaderComponent implements OnInit {
  userRole: string | null = null;
  userFullName: string = '';
  unreadNotifications = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userRole = user.userType;
        this.userFullName = `${user.firstName} ${user.lastName}`;
        
        // In a real app, we would get unread notifications count from a service
        this.unreadNotifications = 0;
      } else {
        this.userRole = null;
        this.userFullName = '';
        this.unreadNotifications = 0;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToDashboard(): void {
    if (this.userRole === 'driver') {
      this.router.navigate(['/driver/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
  }

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}