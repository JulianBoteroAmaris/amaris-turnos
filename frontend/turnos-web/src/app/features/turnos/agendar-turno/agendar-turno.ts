import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { extraerMensajeError } from '../../../core/http-error.util';
import { RelojService } from '../../../core/reloj.service';
import { SucursalesService } from '../../../core/sucursales.service';
import { TurnosService } from '../../../core/turnos.service';
import { Sucursal } from '../../../shared/models/sucursal.model';
import { Turno } from '../../../shared/models/turno.model';
import {
  claseEstadoTurno,
  estadoMostradoTurno,
  tiempoRestanteTurno,
} from '../../../shared/turno-estado.util';

const MENSAJE_ERROR_POR_DEFECTO = 'Ocurrió un error inesperado al comunicarse con la API.';
const ESTADOS_VIGENTES = ['Pendiente', 'Activado'];

@Component({
  selector: 'app-agendar-turno',
  imports: [ReactiveFormsModule],
  templateUrl: './agendar-turno.html',
  styleUrl: './agendar-turno.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RelojService],
})
export class AgendarTurno implements OnInit {
  private readonly turnosService = inject(TurnosService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reloj = inject(RelojService);

  protected readonly form = this.formBuilder.nonNullable.group({
    cedula: ['', [Validators.required, Validators.pattern(/^[0-9]{6,15}$/)]],
    sucursalId: [null as number | null, [Validators.required]],
  });

  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly errorSucursales = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly turnoActual = signal<Turno | null>(null);
  protected readonly consultando = signal(false);
  protected readonly consultaRealizada = signal(false);
  protected readonly errorConsulta = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarSucursales();
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
      next: (turno) => {
        this.enviando.set(false);
        this.form.reset({ cedula: '', sucursalId: null });
        this.errorConsulta.set(null);
        this.consultaRealizada.set(true);
        this.turnoActual.set(turno);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorEnvio.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO));
      },
    });
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  protected consultarTurnoActual(): void {
    const cedulaControl = this.form.controls.cedula;

    if (cedulaControl.invalid) {
      cedulaControl.markAsTouched();
      return;
    }

    this.consultando.set(true);
    this.errorConsulta.set(null);

    this.turnosService.obtener({ cedula: cedulaControl.value }).subscribe({
      next: (turnos) => {
        this.consultando.set(false);
        this.consultaRealizada.set(true);
        this.turnoActual.set(this.turnoVigenteMasReciente(turnos));
      },
      error: (error: HttpErrorResponse) => {
        this.consultando.set(false);
        this.errorConsulta.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO));
      },
    });
  }

  protected activar(turno: Turno): void {
    this.turnosService.activar(turno.id).subscribe({
      next: (turnoActualizado) => this.turnoActual.set(turnoActualizado),
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

  private turnoVigenteMasReciente(turnos: Turno[]): Turno | null {
    const vigentes = turnos.filter((turno) => ESTADOS_VIGENTES.includes(turno.estado));

    if (vigentes.length === 0) {
      return null;
    }

    return vigentes.reduce((masReciente, actual) =>
      new Date(actual.fechaHoraCreacion) > new Date(masReciente.fechaHoraCreacion)
        ? actual
        : masReciente,
    );
  }

  private cargarSucursales(): void {
    this.sucursalesService.obtener().subscribe({
      next: (sucursales) => this.sucursales.set(sucursales),
      error: (error: HttpErrorResponse) =>
        this.errorSucursales.set(extraerMensajeError(error, MENSAJE_ERROR_POR_DEFECTO)),
    });
  }
}
