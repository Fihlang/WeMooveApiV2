import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

interface AuthResponse {
  user: User;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  public authStatusChange = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Load user data from localStorage on service initialization
    const storedData = localStorage.getItem('auth_data');
    const userData = storedData ? JSON.parse(storedData) : null;
    
    this.currentUserSubject = new BehaviorSubject<User | null>(userData?.user || null);
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Emit initial auth status
    this.authStatusChange.next(!!userData?.user);
  }

  /**
   * Get the current user value without subscribing to the observable
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  public get isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  /**
   * Check if the current user is a driver
   */
  public get isDriver(): boolean {
    return this.isAuthenticated && this.currentUserValue?.userType === 'driver';
  }

  /**
   * Get the current authentication token
   */
  public getAuthToken(): string | null {
    const authData = localStorage.getItem('auth_data');
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        return token;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Log in a user
   * @param loginData Login credentials
   */
  public login(loginData: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        map(response => response.user),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register a new user
   * @param userData User registration data
   */
  public register(userData: any): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        map(response => response.user),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Log out the current user
   */
  public logout(): void {
    // Remove user from local storage
    localStorage.removeItem('auth_data');
    
    // Clear user from BehaviorSubject
    this.currentUserSubject.next(null);
    
    // Emit auth status change
    this.authStatusChange.next(false);
  }

  /**
   * Update user profile
   * @param userData Updated user data
   */
  public updateProfile(userData: Partial<User>): Observable<User> {
    const userId = this.currentUserValue?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    return this.http.put<User>(`${environment.apiUrl}/users/${userId}`, userData)
      .pipe(
        tap(updatedUser => {
          // Update local storage with new user data
          const authData = localStorage.getItem('auth_data');
          if (authData) {
            try {
              const data = JSON.parse(authData);
              data.user = updatedUser;
              localStorage.setItem('auth_data', JSON.stringify(data));
              
              // Update the behavior subject
              this.currentUserSubject.next(updatedUser);
            } catch (e) {
              console.error('Error updating user data in storage:', e);
            }
          }
        }),
        catchError(error => {
          console.error('Profile update error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Process and save authentication response
   * @param response Authentication response from the API
   */
  private handleAuthResponse(response: AuthResponse): void {
    // Store auth data in localStorage
    localStorage.setItem('auth_data', JSON.stringify({
      user: response.user,
      token: response.token
    }));
    
    // Update the behavior subject
    this.currentUserSubject.next(response.user);
    
    // Emit auth status change
    this.authStatusChange.next(true);
  }
}