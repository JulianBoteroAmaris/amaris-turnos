import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../shared/models/auth.model';

const TOKEN_STORAGE_KEY = 'turnos_web_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly estaAutenticado = signal(this.hayTokenGuardado());

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credenciales).pipe(
      tap((respuesta) => {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, respuesta.token);
        this.estaAutenticado.set(true);
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    this.estaAutenticado.set(false);
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private hayTokenGuardado(): boolean {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) !== null;
  }
}
