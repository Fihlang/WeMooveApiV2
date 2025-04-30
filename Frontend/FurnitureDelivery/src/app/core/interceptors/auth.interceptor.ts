import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding authentication for login or registration requests
    if (request.url.includes('/auth/login') || 
        request.url.includes('/auth/register')) {
      return next.handle(request);
    }
    
    // Get auth data from local storage
    const authData = localStorage.getItem('auth_data');
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        
        // Clone the request and add the Authorization header
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error parsing auth data', error);
      }
    }

    return next.handle(request);
  }
}