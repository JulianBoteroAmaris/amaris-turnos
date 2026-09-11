import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SucursalesService } from '../../../core/sucursales.service';
import { TurnosService } from '../../../core/turnos.service';
import { Sucursal } from '../../../shared/models/sucursal.model';
import { Turno } from '../../../shared/models/turno.model';

@Component({
  selector: 'app-agendar-turno',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './agendar-turno.html',
  styleUrl: './agendar-turno.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendarTurno implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    cedula: ['', [Validators.required, Validators.pattern(/^[0-9]{6,10}$/)]],
    sucursalId: [null as number | null, [Validators.required]],
  });

  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly cargandoTurnos = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly ahora = signal(new Date());

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarTurnos();

    const intervaloReloj = setInterval(() => this.ahora.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervaloReloj));
  }

  protected agendar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { cedula, sucursalId } = this.form.getRawValue();
    this.enviando.set(true);
    this.errorEnvio.set(null);

    this.turnosService.crear({ cedula, sucursalId: sucursalId! }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.form.reset({ cedula: '', sucursalId: null });
        this.cargarTurnos();
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorEnvio.set(this.extraerMensajeError(error));
      },
    });
  }

  protected activar(turno: Turno): void {
    this.turnosService.activar(turno.id).subscribe({
      next: () => this.cargarTurnos(),
      error: (error: HttpErrorResponse) => this.errorEnvio.set(this.extraerMensajeError(error)),
    });
  }

  protected estadoMostrado(turno: Turno): string {
    if (turno.estado !== 'Pendiente') {
      return turno.estado;
    }

    return new Date(turno.fechaHoraExpiracion) <= this.ahora() ? 'Expirado' : 'Pendiente';
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

  private cargarSucursales(): void {
    this.sucursalesService.obtener().subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: (error: HttpErrorResponse) => this.errorCarga.set(this.extraerMensajeError(error)),
    });
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
