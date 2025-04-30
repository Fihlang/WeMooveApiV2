import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());

  constructor(private httpService: HttpService) { }

  /**
   * Get the current user as an Observable
   */
  get currentUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  /**
   * Get the current authentication token as an Observable
   */
  get token$(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  /**
   * Get the current user from the BehaviorSubject
   */
  get currentUser(): User | null {
    return this.userSubject.value;
  }

  /**
   * Get the current token from the BehaviorSubject
   */
  get token(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Check if the user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.getTokenFromStorage();
  }

  /**
   * Get the current user's role
   */
  get userRole(): string | null {
    const user = this.getUserFromStorage();
    return user ? user.userType : null;
  }

  /**
   * Log in a user
   * @param credentials Login credentials
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('users/login', credentials).pipe(
      tap(response => {
        if (response.user && response.token) {
          this.setUserInStorage(response.user);
          this.setTokenInStorage(response.token);
          this.userSubject.next(response.user);
          this.tokenSubject.next(response.token);
        }
      })
    );
  }

  /**
   * Register a new user
   * @param userData User registration data
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('users/register', userData).pipe(
      tap(response => {
        if (response.user && response.token) {
          this.setUserInStorage(response.user);
          this.setTokenInStorage(response.token);
          this.userSubject.next(response.user);
          this.tokenSubject.next(response.token);
        }
      })
    );
  }

  /**
   * Log out the current user
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.tokenSubject.next(null);
  }

  /**
   * Update the current user's profile
   * @param userId User ID
   * @param userData Updated user data
   */
  updateProfile(userId: number, userData: Partial<User>): Observable<User> {
    return this.httpService.put<User>(`users/${userId}`, userData).pipe(
      tap(updatedUser => {
        const currentUser = this.getUserFromStorage();
        if (currentUser && currentUser.id === updatedUser.id) {
          const mergedUser = { ...currentUser, ...updatedUser };
          this.setUserInStorage(mergedUser);
          this.userSubject.next(mergedUser);
        }
      })
    );
  }

  /**
   * Get user from local storage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Get token from local storage
   */
  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Store user in local storage
   * @param user User object
   */
  private setUserInStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Store token in local storage
   * @param token Authentication token
   */
  private setTokenInStorage(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}