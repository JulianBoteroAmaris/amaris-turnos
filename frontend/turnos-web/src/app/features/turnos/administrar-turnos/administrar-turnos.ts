import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { TurnosService } from '../../../core/turnos.service';
import { Turno } from '../../../shared/models/turno.model';

@Component({
  selector: 'app-administrar-turnos',
  imports: [DatePipe],
  templateUrl: './administrar-turnos.html',
  styleUrl: './administrar-turnos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrarTurnos implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly turnos = signal<Turno[]>([]);
  protected readonly cargandoTurnos = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorAccion = signal<string | null>(null);
  protected readonly ahora = signal(new Date());

  ngOnInit(): void {
    this.cargarTurnos();

    const intervaloReloj = setInterval(() => this.ahora.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervaloReloj));
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected activar(turno: Turno): void {
    this.turnosService.activar(turno.id).subscribe({
      next: () => this.cargarTurnos(),
      error: (error: HttpErrorResponse) => this.errorAccion.set(this.extraerMensajeError(error)),
    });
  }

  protected cancelar(turno: Turno): void {
    this.turnosService.cancelar(turno.id).subscribe({
      next: () => this.cargarTurnos(),
      error: (error: HttpErrorResponse) => this.errorAccion.set(this.extraerMensajeError(error)),
    });
  }

  protected estadoMostrado(turno: Turno): string {
    if (turno.estado !== 'Pendiente') {
      return turno.estado;
    }

    return new Date(turno.fechaHoraExpiracion) <= this.ahora() ? 'Expirado' : 'Pendiente';
  }

  protected claseEstado(turno: Turno): string {
    switch (this.estadoMostrado(turno)) {
      case 'Pendiente':
        return 'badge-pendiente';
      case 'Activado':
        return 'badge-activado';
      case 'Expirado':
        return 'badge-expirado';
      case 'Cancelado':
        return 'badge-cancelado';
      default:
        return '';
    }
  }

  protected tiempoRestante(turno: Turno): string {
    const milisegundosRestantes = new Date(turno.fechaHoraExpiracion).getTime() - this.ahora().getTime();
    if (milisegundosRestantes <= 0) {
      return '00:00';
    }

    const segundosTotales = Math.floor(milisegundosRestantes / 1000);
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  private cargarTurnos(): void {
    this.cargandoTurnos.set(true);
    this.turnosService.obtener().subscribe({
      next: (turnos) => {
        this.cargandoTurnos.set(false);
        this.turnos.set(turnos);
      },
      error: (error: HttpErrorResponse) => {
        this.cargandoTurnos.set(false);
        this.errorCarga.set(this.extraerMensajeError(error));
      },
    });
  }

  private extraerMensajeError(error: HttpErrorResponse): string {
    if (typeof error.error?.mensaje === 'string') {
      return error.error.mensaje;
    }
    if (typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    if (typeof error.error?.title === 'string') {
      return error.error.title;
    }
    return error.message || 'Ocurrió un error inesperado al comunicarse con la API.';
  }
}
