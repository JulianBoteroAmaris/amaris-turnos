import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { extraerMensajeError } from './http-error.util';
import { TurnosService } from './turnos.service';
import { Turno } from '../shared/models/turno.model';

@Injectable()
export class TurnosListaService {
  private readonly turnosService = inject(TurnosService);

  readonly turnos = signal<Turno[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargar(): void {
    this.cargando.set(true);
    this.turnosService.obtener().subscribe({
      next: (turnos) => {
        this.cargando.set(false);
        this.turnos.set(turnos);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          extraerMensajeError(error, 'Ocurrió un error inesperado al comunicarse con la API.'),
        );
      },
    });
  }
}
