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

  function crearComponenteConTurnos(turnos: Turno[]): ComponentFixture<AgendarTurno> {
    const nuevoFixture = TestBed.createComponent(AgendarTurno);
    nuevoFixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/sucursales`).flush(sucursales);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnos);
    nuevoFixture.detectChanges();
    return nuevoFixture;
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

  it('marca la cédula como inválida si no cumple el patrón numérico', () => {
    const cedulaInput: HTMLInputElement = fixture.debugElement.query(By.css('#cedula')).nativeElement;
    cedulaInput.value = 'abc123';
    cedulaInput.dispatchEvent(new Event('input'));

    const select: HTMLSelectElement = fixture.debugElement.query(By.css('#sucursal')).nativeElement;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form')).nativeElement;
    formEl.dispatchEvent(new Event('submit'));

    httpMock.expectNone(`${environment.apiUrl}/turnos`);

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ingresa una cédula válida');
  });

  it('asigna la clase de badge correspondiente al estado Pendiente', () => {
    const badge: HTMLElement = fixture.debugElement.query(By.css('.badge-estado')).nativeElement;
    expect(badge.classList.contains('badge-pendiente')).toBe(true);
  });

  it('asigna las clases de badge correctas para los estados Activado y Cancelado', () => {
    const turnoActivado: Turno = { ...turnoPendiente, id: 2, estado: 'Activado' };
    const turnoCancelado: Turno = { ...turnoPendiente, id: 3, estado: 'Cancelado' };

    const nuevoFixture = crearComponenteConTurnos([turnoActivado, turnoCancelado]);

    const badges = nuevoFixture.debugElement.queryAll(By.css('.badge-estado'));
    expect((badges[0].nativeElement as HTMLElement).classList.contains('badge-activado')).toBe(true);
    expect((badges[1].nativeElement as HTMLElement).classList.contains('badge-cancelado')).toBe(true);
  });

  it('calcula el tiempo restante en formato mm:ss', () => {
    vi.useFakeTimers();
    const instante = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(instante);

    const turno: Turno = {
      ...turnoPendiente,
      fechaHoraExpiracion: new Date(instante.getTime() + 5 * 60 * 1000 + 30 * 1000).toISOString(),
    };

    const nuevoFixture = crearComponenteConTurnos([turno]);

    const texto = (nuevoFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('(05:30)');

    vi.useRealTimers();
  });

  it('cambia el estado mostrado a Expirado y oculta el botón de activar cuando se cumple el tiempo', () => {
    vi.useFakeTimers();
    const instante = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(instante);

    const turnoPorExpirar: Turno = {
      ...turnoPendiente,
      fechaHoraExpiracion: new Date(instante.getTime() + 5000).toISOString(),
    };

    const nuevoFixture = crearComponenteConTurnos([turnoPorExpirar]);

    let texto = (nuevoFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Pendiente');
    expect(nuevoFixture.debugElement.query(By.css('.boton-activar'))).toBeTruthy();

    vi.advanceTimersByTime(6000);
    nuevoFixture.detectChanges();

    texto = (nuevoFixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Expirado');
    const badge: HTMLElement = nuevoFixture.debugElement.query(By.css('.badge-estado')).nativeElement;
    expect(badge.classList.contains('badge-expirado')).toBe(true);
    expect(nuevoFixture.debugElement.query(By.css('.boton-activar'))).toBeNull();

    vi.useRealTimers();
  });

  it('muestra la confirmación con los datos del turno tras agendarlo exitosamente', () => {
    llenarYEnviarFormulario();

    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnoPendiente);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turnoPendiente]);

    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('agendado con éxito');
    expect(texto).toContain('Sucursal Centro');
    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeTruthy();
  });

  it('oculta la confirmación al hacer clic en "Cerrar"', () => {
    llenarYEnviarFormulario();
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnoPendiente);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turnoPendiente]);
    fixture.detectChanges();

    const botonCerrar: HTMLButtonElement = fixture.debugElement.query(
      By.css('.boton-cerrar-confirmacion'),
    ).nativeElement;
    botonCerrar.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeNull();
  });

  it('oculta automáticamente la confirmación después de 8 segundos', () => {
    vi.useFakeTimers();

    llenarYEnviarFormulario();
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnoPendiente);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turnoPendiente]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeTruthy();

    vi.advanceTimersByTime(8000);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeNull();

    vi.useRealTimers();
  });

  it('oculta la confirmación previa al iniciar un nuevo envío', () => {
    llenarYEnviarFormulario();
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnoPendiente);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turnoPendiente]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeTruthy();

    llenarYEnviarFormulario();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.confirmacion-turno'))).toBeNull();

    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush(turnoPendiente);
    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turnoPendiente]);
  });
});
