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
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { extraerMensajeError } from '../../../core/http-error.util';
import { RelojService } from '../../../core/reloj.service';
import { SucursalesService } from '../../../core/sucursales.service';
import { TurnosListaService } from '../../../core/turnos-lista.service';
import { TurnosService } from '../../../core/turnos.service';
import { Sucursal } from '../../../shared/models/sucursal.model';
import { Turno } from '../../../shared/models/turno.model';
import {
  claseEstadoTurno,
  estadoMostradoTurno,
  tiempoRestanteTurno,
} from '../../../shared/turno-estado.util';

const MENSAJE_ERROR_POR_DEFECTO = 'Ocurrió un error inesperado al comunicarse con la API.';

@Component({
  selector: 'app-agendar-turno',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './agendar-turno.html',
  styleUrl: './agendar-turno.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RelojService, TurnosListaService],
})
export class AgendarTurno implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloj = inject(RelojService);
  private readonly turnosLista = inject(TurnosListaService);

  protected readonly form = this.formBuilder.nonNullable.group({
    cedula: ['', [Validators.required, Validators.pattern(/^[0-9]{6,15}$/)]],
    sucursalId: [null as number | null, [Validators.required]],
  });

  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly turnos = this.turnosLista.turnos;
  protected readonly cargandoTurnos = this.turnosLista.cargando;
  protected readonly errorCarga = this.turnosLista.error;
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly turnoConfirmado = signal<Turno | null>(null);

  private temporizadorConfirmacion: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.cargarSucursales();
    this.turnosLista.cargar();

    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorConfirmacion));
  }

  protected agendar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { cedula, sucursalId } = this.form.getRawValue();
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.ocultarConfirmacion();

    this.turnosService.crear({ cedula, sucursalId: sucursalId! }).subscribe({
      next: (turno) => {
        this.enviando.set(false);
        this.form.reset({ cedula: '', sucursalId: null });
        this.mostrarConfirmacion(turno);
        this.turnosLista.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorEnvio.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO));
      },
    });
  }

  protected cerrarConfirmacion(): void {
    this.ocultarConfirmacion();
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected activar(turno: Turno): void {
    this.turnosService.activar(turno.id).subscribe({
      next: () => this.turnosLista.cargar(),
      error: (error: HttpErrorResponse) =>
        this.errorEnvio.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO)),
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

  private mostrarConfirmacion(turno: Turno): void {
    this.turnoConfirmado.set(turno);
    clearTimeout(this.temporizadorConfirmacion);
    this.temporizadorConfirmacion = setTimeout(() => this.turnoConfirmado.set(null), 8000);
  }

  private ocultarConfirmacion(): void {
    clearTimeout(this.temporizadorConfirmacion);
    this.turnoConfirmado.set(null);
  }

  private cargarSucursales(): void {
    this.sucursalesService.obtener().subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: (error: HttpErrorResponse) =>
        this.errorCarga.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO)),
    });
  }
}
