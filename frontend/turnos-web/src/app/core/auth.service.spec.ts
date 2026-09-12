import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('no está autenticado si no hay token guardado', () => {
    expect(service.estaAutenticado()).toBe(false);
    expect(service.obtenerToken()).toBeNull();
    expect(service.rol()).toBeNull();
  });

  it('guarda el token y el rol, y marca la sesión como activa al iniciar sesión', () => {
    service.login({ nombreUsuario: 'admin', password: 'Admin123!' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombreUsuario: 'admin', password: 'Admin123!' });
    req.flush({ token: 'token-de-prueba', rol: 'Administrador' });

    expect(service.estaAutenticado()).toBe(true);
    expect(service.obtenerToken()).toBe('token-de-prueba');
    expect(service.rol()).toBe('Administrador');
  });

  it('no guarda token ni rol si el login falla', () => {
    service.login({ nombreUsuario: 'admin', password: 'incorrecta' }).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ mensaje: 'Credenciales inválidas.' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.estaAutenticado()).toBe(false);
    expect(service.obtenerToken()).toBeNull();
    expect(service.rol()).toBeNull();
  });

  it('elimina el token y el rol, y marca la sesión como inactiva al cerrar sesión', () => {
    service.login({ nombreUsuario: 'admin', password: 'Admin123!' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ token: 'token-de-prueba', rol: 'Asesor' });

    service.logout();

    expect(service.estaAutenticado()).toBe(false);
    expect(service.obtenerToken()).toBeNull();
    expect(service.rol()).toBeNull();
  });

  it('esAdministrador() retorna true solo cuando el rol es Administrador', () => {
    expect(service.esAdministrador()).toBe(false);

    service.login({ nombreUsuario: 'admin', password: 'Admin123!' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ token: 'token-de-prueba', rol: 'Administrador' });

    expect(service.esAdministrador()).toBe(true);
  });

  it('esAdministrador() retorna false cuando el rol es Asesor', () => {
    service.login({ nombreUsuario: 'asesor', password: 'Admin123!' }).subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ token: 'token-de-prueba', rol: 'Asesor' });

    expect(service.esAdministrador()).toBe(false);
  });
});
