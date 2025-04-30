import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param params Optional query parameters
   * @param headers Optional HTTP headers
   */
  get<T>(endpoint: string, params?: any, headers?: HttpHeaders): Observable<T> {
    const options = {
      params: new HttpParams({ fromObject: params || {} }),
      headers: headers
    };
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, options);
  }

  /**
   * Make a POST request
   * @param endpoint API endpoint
   * @param body Request body
   * @param headers Optional HTTP headers
   */
  post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
  }

  /**
   * Make a PUT request
   * @param endpoint API endpoint
   * @param body Request body
   * @param headers Optional HTTP headers
   */
  put<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
  }

  /**
   * Make a DELETE request
   * @param endpoint API endpoint
   * @param headers Optional HTTP headers
   */
  delete<T>(endpoint: string, headers?: HttpHeaders): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers });
  }

  /**
   * Make a PATCH request
   * @param endpoint API endpoint
   * @param body Request body
   * @param headers Optional HTTP headers
   */
  patch<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body, { headers });
  }
}