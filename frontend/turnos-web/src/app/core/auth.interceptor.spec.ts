import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('agrega el header Authorization cuando hay un token guardado', () => {
    authService.login({ nombreUsuario: 'admin', password: 'Admin123!' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({ token: 'token-de-prueba' });

    http.get('/api/turnos').subscribe();

    const req = httpMock.expectOne('/api/turnos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush({});
  });

  it('no agrega el header Authorization cuando no hay token', () => {
    expect(authService.obtenerToken()).toBeNull();

    http.get('/api/sucursales').subscribe();

    const req = httpMock.expectOne('/api/sucursales');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
