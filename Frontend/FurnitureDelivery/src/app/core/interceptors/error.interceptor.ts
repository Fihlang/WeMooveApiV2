import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if ([401, 403].includes(error.status)) {
          // Auto logout if 401 Unauthorized or 403 Forbidden response 
          // returned from API (except for login/register endpoints)
          if (!request.url.includes('/auth/login') && 
              !request.url.includes('/auth/register')) {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }
        }
        
        // Format the error message
        const errorMessage = this.getErrorMessage(error);
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  
  private getErrorMessage(error: HttpErrorResponse): string {
    // Try to get the error message from the response
    if (error.error && typeof error.error === 'object') {
      if (error.error.message) {
        return error.error.message;
      }
      
      if (error.error.error) {
        return error.error.error;
      }
    }
    
    // Fallback to standard error messages based on status code
    switch (error.status) {
      case 400:
        return 'Bad request. Please check your input and try again.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission to access this resource.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Unknown error occurred: ${error.status}`;
    }
  }
}