import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { 
  User, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  RegisterDriverRequest, 
  UpdateProfileRequest, 
  ChangePasswordRequest 
} from '../../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  public get isDriver(): boolean {
    return this.currentUserSubject.value?.userType === 'driver';
  }

  public get isCustomer(): boolean {
    return this.currentUserSubject.value?.userType === 'customer';
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return this.handleAuthResponse(response.data);
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => new Error(error.error?.message || 'Login failed'));
        })
      );
  }

  registerCustomer(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register/customer`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return this.handleAuthResponse(response.data);
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Registration error', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed'));
        })
      );
  }

  registerDriver(request: RegisterDriverRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register/driver`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            return this.handleAuthResponse(response.data);
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Driver registration error', error);
          return throwError(() => new Error(error.error?.message || 'Driver registration failed'));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('auth_data');
    this.currentUserSubject.next(null);
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/auth/profile`)
      .pipe(
        map(response => {
          if (response && response.data) {
            return response.data;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Get profile error', error);
          return throwError(() => new Error(error.error?.message || 'Failed to get profile'));
        })
      );
  }

  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<any>(`${environment.apiUrl}/auth/profile`, request)
      .pipe(
        map(response => {
          if (response && response.data) {
            const updatedUser = response.data;
            // Update the current user in local storage and behavior subject
            const authData = this.getAuthDataFromStorage();
            if (authData) {
              authData.user = updatedUser;
              localStorage.setItem('auth_data', JSON.stringify(authData));
              this.currentUserSubject.next(updatedUser);
            }
            return updatedUser;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Update profile error', error);
          return throwError(() => new Error(error.error?.message || 'Failed to update profile'));
        })
      );
  }

  changePassword(request: ChangePasswordRequest): Observable<boolean> {
    return this.http.put<any>(`${environment.apiUrl}/auth/change-password`, request)
      .pipe(
        map(response => {
          if (response && response.success) {
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Change password error', error);
          return throwError(() => new Error(error.error?.message || 'Failed to change password'));
        })
      );
  }

  validateToken(token: string): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/auth/validate`, { token })
      .pipe(
        map(response => {
          if (response && response.data !== undefined) {
            return response.data;
          }
          return false;
        }),
        catchError(() => of(false))
      );
  }

  private handleAuthResponse(authResponse: AuthResponse): AuthResponse {
    if (authResponse && authResponse.token) {
      // Store auth data in local storage
      localStorage.setItem('auth_data', JSON.stringify({
        token: authResponse.token,
        user: authResponse.user,
        expiresAt: authResponse.expiresAt
      }));

      // Update current user behavior subject
      this.currentUserSubject.next(authResponse.user);

      // Set auto logout when token expires
      this.autoLogout(new Date(authResponse.expiresAt).getTime() - new Date().getTime());
    }
    return authResponse;
  }

  private checkAuthStatus(): void {
    const authData = this.getAuthDataFromStorage();
    if (authData && authData.token && authData.user) {
      const expirationDate = new Date(authData.expiresAt);

      // Check if token is still valid
      if (expirationDate > new Date()) {
        this.currentUserSubject.next(authData.user);
        this.autoLogout(expirationDate.getTime() - new Date().getTime());
      } else {
        // Token expired, clear storage
        this.logout();
      }
    }
  }

  private autoLogout(expirationDuration: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private getAuthDataFromStorage(): { token: string; user: User; expiresAt: string } | null {
    const storedAuthData = localStorage.getItem('auth_data');
    if (storedAuthData) {
      try {
        return JSON.parse(storedAuthData);
      } catch (e) {
        console.error('Error parsing auth data from storage', e);
        return null;
      }
    }
    return null;
  }
}