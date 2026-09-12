import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth.service';
import { Turno } from '../../../shared/models/turno.model';
import { AdministrarTurnos } from './administrar-turnos';

describe('AdministrarTurnos', () => {
  let fixture: ComponentFixture<AdministrarTurnos>;
  let httpMock: HttpTestingController;
  let router: Router;
  let authService: AuthService;

  const turnoPendiente: Turno = {
    id: 1,
    numeroTurno: 3,
    cedulaCliente: '1023456789',
    sucursalId: 1,
    sucursalNombre: 'Sucursal Centro',
    estado: 'Pendiente',
    fechaHoraCreacion: new Date().toISOString(),
    fechaHoraExpiracion: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    fechaHoraActivacion: null,
  };

  function flushCargaInicial(turnos: Turno[] = [turnoPendiente]): void {
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnos);
  }

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdministrarTurnos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrarTurnos);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);

    fixture.detectChanges();
    flushCargaInicial();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('debería crearse', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra los turnos cargados', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sucursal Centro');
    expect(texto).toContain('3');
    expect(texto).toContain('Pendiente');
  });

  it('activa un turno y refresca la lista', () => {
    const botonActivar: HTMLButtonElement = fixture.debugElement.query(
      By.css('tbody button'),
    ).nativeElement;
    botonActivar.click();

    const activarReq = httpMock.expectOne(`${environment.apiUrl}/turnos/1/activar`);
    expect(activarReq.request.method).toBe('POST');
    activarReq.flush({ ...turnoPendiente, estado: 'Activado' });

    const refrescoReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    refrescoReq.flush([{ ...turnoPendiente, estado: 'Activado' }]);

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Activado');
  });

  it('cancela un turno y refresca la lista', () => {
    const botones = fixture.debugElement.queryAll(By.css('tbody button'));
    const botonCancelar: HTMLButtonElement = botones[1].nativeElement;
    botonCancelar.click();

    const cancelarReq = httpMock.expectOne(`${environment.apiUrl}/turnos/1/cancelar`);
    expect(cancelarReq.request.method).toBe('POST');
    cancelarReq.flush({ ...turnoPendiente, estado: 'Cancelado' });

    const refrescoReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    refrescoReq.flush([{ ...turnoPendiente, estado: 'Cancelado' }]);

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cancelado');
  });

  it('cierra la sesión y navega a login al hacer clic en "Cerrar sesión"', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    authService.estaAutenticado.set(true);

    const botonCerrarSesion: HTMLButtonElement = fixture.debugElement.query(
      By.css('.encabezado button'),
    ).nativeElement;
    botonCerrarSesion.click();

    expect(authService.estaAutenticado()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
