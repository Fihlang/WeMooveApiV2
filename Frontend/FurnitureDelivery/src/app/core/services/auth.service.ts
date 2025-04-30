import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  isVerified: boolean;
  userType: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  userType: 'customer' | 'driver';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  // Load user from localStorage on service initialization
  private loadStoredAuth(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        this.tokenSubject.next(token);
        this.currentUserSubject.next(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }

  // Get current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Get current token value
  public get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  // Check if user is authenticated
  public get isAuthenticated(): boolean {
    return !!this.tokenValue;
  }

  // Login method
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => new Error(error.error?.message || 'Login failed. Please check your credentials.'));
        })
      );
  }

  // Register method
  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed. Please try again.'));
        })
      );
  }

  // Logout method
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // Refresh token - would be implemented in a real app
  refreshToken(): Observable<string> {
    // This would call an API endpoint to refresh the token
    // For now, we'll just return the current token
    const token = this.tokenValue;
    if (!token) {
      return throwError(() => new Error('No token available'));
    }
    return of(token);
  }

  // Handle successful auth response
  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.token && response.user) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.tokenSubject.next(response.token);
      this.currentUserSubject.next(response.user);
    }
  }
}