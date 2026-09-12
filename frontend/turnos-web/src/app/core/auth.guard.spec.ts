import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('permite el acceso si hay sesión activa', () => {
    authService.estaAutenticado.set(true);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('redirige a login si no hay sesión activa', () => {
    authService.estaAutenticado.set(false);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    ) as UrlTree;

    expect(resultado.toString()).toBe(router.createUrlTree(['/login']).toString());
  });
});
