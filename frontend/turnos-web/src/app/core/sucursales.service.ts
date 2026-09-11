import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Sucursal } from '../shared/models/sucursal.model';

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sucursales`;

  obtener(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.baseUrl);
  }
}
