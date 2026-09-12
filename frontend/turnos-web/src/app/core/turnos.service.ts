import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CrearTurnoRequest, FiltroTurnos, Turno } from '../shared/models/turno.model';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/turnos`;

  crear(request: CrearTurnoRequest): Observable<Turno> {
    return this.http.post<Turno>(this.baseUrl, request);
  }

  obtener(filtro?: FiltroTurnos): Observable<Turno[]> {
    let params = new HttpParams();

    if (filtro?.sucursalId != null) {
      params = params.set('sucursalId', filtro.sucursalId);
    }
    if (filtro?.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro?.fecha) {
      params = params.set('fecha', filtro.fecha);
    }
    if (filtro?.cedula) {
      params = params.set('cedula', filtro.cedula);
    }

    return this.http.get<Turno[]>(this.baseUrl, { params });
  }

  obtenerPorId(id: number): Observable<Turno> {
    return this.http.get<Turno>(`${this.baseUrl}/${id}`);
  }

  activar(id: number): Observable<Turno> {
    return this.http.post<Turno>(`${this.baseUrl}/${id}/activar`, {});
  }

  cancelar(id: number): Observable<Turno> {
    return this.http.post<Turno>(`${this.baseUrl}/${id}/cancelar`, {});
  }
}
