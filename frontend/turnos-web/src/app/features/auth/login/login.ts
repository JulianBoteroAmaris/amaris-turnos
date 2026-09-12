import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected readonly enviando = signal(false);
  protected readonly errorLogin = signal<string | null>(null);

  protected iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorLogin.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl('/');
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
