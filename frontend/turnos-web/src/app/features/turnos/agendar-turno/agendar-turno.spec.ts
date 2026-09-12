import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth.service';
import { Sucursal } from '../../../shared/models/sucursal.model';
import { Turno } from '../../../shared/models/turno.model';
import { AgendarTurno } from './agendar-turno';

describe('AgendarTurno', () => {
  let fixture: ComponentFixture<AgendarTurno>;
  let httpMock: HttpTestingController;
  let router: Router;
  let authService: AuthService;

  const sucursales: Sucursal[] = [
    { id: 1, nombre: 'Sucursal Centro', direccion: 'Calle 10', ciudad: 'Bogotá', activa: true },
  ];

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
    httpMock.expectOne(`${environment.apiUrl}/sucursales`).flush(sucursales);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnos);
  }

  function llenarYEnviarFormulario(): void {
    const cedulaInput: HTMLInputElement = fixture.debugElement.query(By.css('#cedula')).nativeElement;
    cedulaInput.value = '1023456789';
    cedulaInput.dispatchEvent(new Event('input'));

    const select: HTMLSelectElement = fixture.debugElement.query(By.css('#sucursal')).nativeElement;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form')).nativeElement;
    formEl.dispatchEvent(new Event('submit'));
  }

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AgendarTurno],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendarTurno);
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

  it('muestra las sucursales y los turnos cargados', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sucursal Centro');
    expect(texto).toContain('3');
    expect(texto).toContain('Pendiente');
  });

  it('no envía el turno si el formulario es inválido', () => {
    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form')).nativeElement;
    formEl.dispatchEvent(new Event('submit'));

    httpMock.expectNone(`${environment.apiUrl}/turnos`);

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ingresa una cédula válida');
    expect(texto).toContain('Selecciona una sucursal');
  });

  it('agenda un turno y refresca la lista cuando el formulario es válido', () => {
    llenarYEnviarFormulario();

    const crearReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    expect(crearReq.request.method).toBe('POST');
    expect(crearReq.request.body).toEqual({ cedula: '1023456789', sucursalId: 1 });
    crearReq.flush(turnoPendiente);

    const refrescoReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    refrescoReq.flush([turnoPendiente]);

    fixture.detectChanges();

    const cedulaInput: HTMLInputElement = fixture.debugElement.query(By.css('#cedula')).nativeElement;
    expect(cedulaInput.value).toBe('');

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toContain('ya tiene 5 turnos');
  });

  it('muestra el mensaje de error de la API cuando se excede el límite diario', () => {
    llenarYEnviarFormulario();

    const crearReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    crearReq.flush(
      { mensaje: 'La cédula ya tiene 5 turnos solicitados hoy.' },
      { status: 409, statusText: 'Conflict' },
    );

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('La cédula ya tiene 5 turnos solicitados hoy.');
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
