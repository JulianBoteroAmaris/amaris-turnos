import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { extraerMensajeError } from '../../../core/http-error.util';
import { GloboAnimado } from '../../../shared/globo-animado/globo-animado';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, GloboAnimado],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  protected iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorLogin.set(null);
    this.sesionExpirada.set(false);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.enviando.set(false);
        const destino = this.authService.esAdministrador() ? '/administrar-turnos' : '/';
        this.router.navigateByUrl(destino);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.errorLogin.set(
          extraerMensajeError(error, 'Ocurrió un error inesperado al iniciar sesión.'),
        );
      },
    });
  }
}
