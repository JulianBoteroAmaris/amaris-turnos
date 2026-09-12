import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RolUsuario } from '../shared/models/auth.model';

const TOKEN_STORAGE_KEY = 'turnos_web_token';
const ROL_STORAGE_KEY = 'turnos_web_rol';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly estaAutenticado = signal(this.hayTokenGuardado());
  readonly rol = signal<RolUsuario | null>(this.obtenerRolGuardado());

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credenciales).pipe(
      tap((respuesta) => {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, respuesta.token);
        sessionStorage.setItem(ROL_STORAGE_KEY, respuesta.rol);
        this.estaAutenticado.set(true);
        this.rol.set(respuesta.rol);
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ROL_STORAGE_KEY);
    this.estaAutenticado.set(false);
    this.rol.set(null);
  }

  obtenerToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  esAdministrador(): boolean {
    return this.rol() === 'Administrador';
  }

  private hayTokenGuardado(): boolean {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) !== null;
  }

  private obtenerRolGuardado(): RolUsuario | null {
    return sessionStorage.getItem(ROL_STORAGE_KEY) as RolUsuario | null;
  }
}
