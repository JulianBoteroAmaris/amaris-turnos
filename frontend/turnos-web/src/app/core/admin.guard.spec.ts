import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';

import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('permite el acceso si el rol es Administrador', () => {
    authService.rol.set('Administrador');

    const resultado = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('redirige a la raíz si el rol no es Administrador', () => {
    authService.rol.set('Cliente');

    const resultado = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never),
    ) as UrlTree;

    expect(resultado.toString()).toBe(router.createUrlTree(['/']).toString());
  });
});
