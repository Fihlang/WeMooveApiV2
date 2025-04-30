import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @param requiresAuth - Whether the request requires authentication
   */
  public get<T>(endpoint: string, params: any = {}, requiresAuth: boolean = true): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = {
      headers: this.buildHeaders(requiresAuth),
      params: this.buildParams(params)
    };

    return this.http.get<T>(url, options)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Post request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication
   */
  public post<T>(endpoint: string, body: any, requiresAuth: boolean = true): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = {
      headers: this.buildHeaders(requiresAuth)
    };

    return this.http.post<T>(url, body, options)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Put request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication
   */
  public put<T>(endpoint: string, body: any, requiresAuth: boolean = true): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = {
      headers: this.buildHeaders(requiresAuth)
    };

    return this.http.put<T>(url, body, options)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Patch request
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param requiresAuth - Whether the request requires authentication
   */
  public patch<T>(endpoint: string, body: any, requiresAuth: boolean = true): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = {
      headers: this.buildHeaders(requiresAuth)
    };

    return this.http.patch<T>(url, body, options)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Delete request
   * @param endpoint - API endpoint
   * @param requiresAuth - Whether the request requires authentication
   */
  public delete<T>(endpoint: string, requiresAuth: boolean = true): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = {
      headers: this.buildHeaders(requiresAuth)
    };

    return this.http.delete<T>(url, options)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Build the full URL for the API request
   * @param endpoint - API endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash from endpoint if present
    if (endpoint.startsWith('/')) {
      endpoint = endpoint.substring(1);
    }
    
    return `${this.baseUrl}/${endpoint}`;
  }

  /**
   * Build headers for the API request
   * @param requiresAuth - Whether the request requires authentication
   */
  private buildHeaders(requiresAuth: boolean): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (requiresAuth) {
      const token = this.authService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Build query parameters for the API request
   * @param params - Query parameters
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return httpParams;
  }

  /**
   * Handle errors from API requests
   * @param error - HTTP error
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Server-side error
      switch (error.status) {
        case 401:
          // Unauthorized - Token might be expired
          this.authService.logout();
          errorMessage = 'Your session has expired. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'An internal server error occurred. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || error.statusText || errorMessage;
      }
    }
    
    console.error('API Error:', error);
    
    return throwError(() => new Error(errorMessage));
  }
}