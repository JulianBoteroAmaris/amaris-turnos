import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import createGlobe, { Globe } from 'cobe';

import { AuthService } from '../../../core/auth.service';

const CIUDADES_GLOBO: { location: [number, number]; size: number }[] = [
  { location: [4.711, -74.0721], size: 0.06 },
  { location: [40.7128, -74.006], size: 0.05 },
  { location: [40.4168, -3.7038], size: 0.05 },
  { location: [35.6762, 139.6503], size: 0.05 },
];

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly globoCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('globoCanvas');
  private globo: Globe | undefined;
  private idAnimacionGlobo = 0;
  private phiGlobo = 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected readonly enviando = signal(false);
  protected readonly errorLogin = signal<string | null>(null);
  protected readonly sesionExpirada = signal(
    this.route.snapshot.queryParamMap.get('sesionExpirada') === 'true',
  );

  protected readonly modoAdministrador = signal(false);

  protected alternarModoAdministrador(): void {
    this.modoAdministrador.update((v) => !v);
  }

  ngAfterViewInit(): void {
    const canvas = this.globoCanvas().nativeElement;

    this.globo = createGlobe(canvas, {
      width: 840,
      height: 840,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.6,
      mapSamples: 18000,
      mapBrightness: 5,
      baseColor: [0.16, 0.2, 0.32],
      markerColor: [0.31, 0.76, 0.88],
      glowColor: [0.55, 0.72, 0.85],
      markers: CIUDADES_GLOBO,
      arcs: [
        { from: CIUDADES_GLOBO[0].location, to: CIUDADES_GLOBO[1].location },
        { from: CIUDADES_GLOBO[0].location, to: CIUDADES_GLOBO[2].location },
        { from: CIUDADES_GLOBO[0].location, to: CIUDADES_GLOBO[3].location },
      ],
      arcColor: [0.31, 0.76, 0.88],
      arcWidth: 0.6,
      arcHeight: 0.28,
    });

    const animar = (): void => {
      this.phiGlobo += 0.0035;
      this.globo?.update({ phi: this.phiGlobo });
      this.idAnimacionGlobo = requestAnimationFrame(animar);
    };
    this.idAnimacionGlobo = requestAnimationFrame(animar);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.idAnimacionGlobo);
    this.globo?.destroy();
  }

  protected iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorLogin.set(null);
    this.sesionExpirada.set(false);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        const destino = respuesta.rol === 'Administrador' ? '/administrar-turnos' : '/';
        this.router.navigateByUrl(destino);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorLogin.set(this.extraerMensajeError(error));
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
    return error.message || 'Ocurrió un error inesperado al iniciar sesión.';
  }
}
