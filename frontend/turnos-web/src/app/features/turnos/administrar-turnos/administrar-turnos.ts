import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { extraerMensajeError } from '../../../core/http-error.util';
import { RelojService } from '../../../core/reloj.service';
import { TurnosListaService } from '../../../core/turnos-lista.service';
import { TurnosService } from '../../../core/turnos.service';
import { Turno } from '../../../shared/models/turno.model';
import {
  claseEstadoTurno,
  estadoMostradoTurno,
  tiempoRestanteTurno,
} from '../../../shared/turno-estado.util';

const MENSAJE_ERROR_POR_DEFECTO = 'Ocurrió un error inesperado al comunicarse con la API.';

@Component({
  selector: 'app-administrar-turnos',
  imports: [DatePipe],
  templateUrl: './administrar-turnos.html',
  styleUrl: './administrar-turnos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RelojService, TurnosListaService],
})
export class AdministrarTurnos implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly reloj = inject(RelojService);
  private readonly turnosLista = inject(TurnosListaService);

  protected readonly turnos = this.turnosLista.turnos;
  protected readonly cargandoTurnos = this.turnosLista.cargando;
  protected readonly errorCarga = this.turnosLista.error;
  protected readonly errorAccion = signal<string | null>(null);

  ngOnInit(): void {
    this.turnosLista.cargar();
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected activar(turno: Turno): void {
    this.turnosService.activar(turno.id).subscribe({
      next: () => this.turnosLista.cargar(),
      error: (error: HttpErrorResponse) =>
        this.errorAccion.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO)),
    });
  }

  protected cancelar(turno: Turno): void {
    this.turnosService.cancelar(turno.id).subscribe({
      next: () => this.turnosLista.cargar(),
      error: (error: HttpErrorResponse) =>
        this.errorAccion.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO)),
    });
  }

  protected estadoMostrado(turno: Turno): string {
    return estadoMostradoTurno(turno, this.reloj.ahora());
  }

  protected claseEstado(turno: Turno): string {
    return claseEstadoTurno(turno, this.reloj.ahora());
  }

  protected tiempoRestante(turno: Turno): string {
    return tiempoRestanteTurno(turno, this.reloj.ahora());
  }
}
