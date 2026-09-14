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

  function flushCargaInicial(): void {
    httpMock.expectOne(`${environment.apiUrl}/sucursales`).flush(sucursales);
  }

  function llenarCedula(cedula: string): void {
    const cedulaInput: HTMLInputElement = fixture.debugElement.query(By.css('#cedula')).nativeElement;
    cedulaInput.value = cedula;
    cedulaInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function llenarYEnviarFormulario(): void {
    llenarCedula('1023456789');

    const select: HTMLSelectElement = fixture.debugElement.query(By.css('#sucursal')).nativeElement;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));

    fixture.detectChanges();

    const formEl: HTMLFormElement = fixture.debugElement.query(By.css('form')).nativeElement;
    formEl.dispatchEvent(new Event('submit'));
  }

  function consultar(): void {
    const botonConsultar: HTMLButtonElement = fixture.debugElement.query(
      By.css('.boton-secundario'),
    ).nativeElement;
    botonConsultar.click();
    fixture.detectChanges();
  }

  function crearComponenteConTurnoActual(turno: Turno): ComponentFixture<AgendarTurno> {
    const nuevoFixture = TestBed.createComponent(AgendarTurno);
    nuevoFixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/sucursales`).flush(sucursales);
    nuevoFixture.detectChanges();

    const cedulaInput: HTMLInputElement = nuevoFixture.debugElement.query(By.css('#cedula')).nativeElement;
    cedulaInput.value = '1023456789';
    cedulaInput.dispatchEvent(new Event('input'));
    nuevoFixture.detectChanges();

    const botonConsultar: HTMLButtonElement = nuevoFixture.debugElement.query(
      By.css('.boton-secundario'),
    ).nativeElement;
    botonConsultar.click();
    nuevoFixture.detectChanges();

    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/turnos`).flush([turno]);
    nuevoFixture.detectChanges();

    return nuevoFixture;
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

  it('muestra las sucursales cargadas en el formulario', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sucursal Centro');
  });

  it('muestra el mensaje inicial antes de consultar un turno', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Ingresa tu cédula y presiona "Consultar"');
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

  it('agenda un turno y lo muestra como turno actual', () => {
    llenarYEnviarFormulario();

    const crearReq = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    expect(crearReq.request.method).toBe('POST');
    expect(crearReq.request.body).toEqual({ cedula: '1023456789', sucursalId: 1 });
    crearReq.flush(turnoPendiente);

    fixture.detectChanges();

    const cedulaInput: HTMLInputElement = fixture.debugElement.query(By.css('#cedula')).nativeElement;
    expect(cedulaInput.value).toBe('');

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('#3');
    expect(texto).toContain('Sucursal Centro');
    expect(texto).toContain('Pendiente');
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
    llenarCedula('abc123');

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

  it('deshabilita el botón "Consultar" y no consulta si la cédula es inválida', () => {
    llenarCedula('abc');

    const botonConsultar: HTMLButtonElement = fixture.debugElement.query(
      By.css('.boton-secundario'),
    ).nativeElement;
    expect(botonConsultar.disabled).toBe(true);

    httpMock.expectNone((r) => r.url === `${environment.apiUrl}/turnos`);
  });

  it('consulta el turno actual de la cédula y lo muestra con su badge', () => {
    llenarCedula('1023456789');
    consultar();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/turnos` && r.params.get('cedula') === '1023456789',
    );
    req.flush([turnoPendiente]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('#3');
    expect(texto).toContain('Sucursal Centro');

    const badge: HTMLElement = fixture.debugElement.query(By.css('.badge-estado')).nativeElement;
    expect(badge.classList.contains('badge-pendiente')).toBe(true);
  });

  it('ignora turnos Expirado/Cancelado y toma el vigente más reciente', () => {
    const turnoCancelado: Turno = {
      ...turnoPendiente,
      id: 2,
      estado: 'Cancelado',
      fechaHoraCreacion: new Date(Date.now() - 60000).toISOString(),
    };
    const turnoExpirado: Turno = {
      ...turnoPendiente,
      id: 3,
      estado: 'Expirado',
      fechaHoraCreacion: new Date(Date.now() - 30000).toISOString(),
    };
    const turnoActivadoReciente: Turno = {
      ...turnoPendiente,
      id: 4,
      numeroTurno: 7,
      estado: 'Activado',
      fechaHoraCreacion: new Date().toISOString(),
    };

    llenarCedula('1023456789');
    consultar();

    httpMock
      .expectOne((r) => r.url === `${environment.apiUrl}/turnos`)
      .flush([turnoCancelado, turnoExpirado, turnoActivadoReciente]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('#7');
    expect(texto).toContain('Activado');
    expect(texto).not.toContain('No tienes ningún turno agendado');
  });

  it('muestra el mensaje de "sin turno" cuando la cédula no tiene turnos vigentes', () => {
    llenarCedula('1023456789');
    consultar();

    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/turnos`).flush([]);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No tienes ningún turno agendado actualmente.');
  });

  it('calcula el tiempo restante en formato mm:ss', () => {
    vi.useFakeTimers();
    const instante = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(instante);

    const turno: Turno = {
      ...turnoPendiente,
      fechaHoraExpiracion: new Date(instante.getTime() + 5 * 60 * 1000 + 30 * 1000).toISOString(),
    };

    const nuevoFixture = crearComponenteConTurnoActual(turno);

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

    const nuevoFixture = crearComponenteConTurnoActual(turnoPorExpirar);

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

  it('activa el turno actual y actualiza su estado con la respuesta de la API', () => {
    llenarCedula('1023456789');
    consultar();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/turnos`).flush([turnoPendiente]);
    fixture.detectChanges();

    const botonActivar: HTMLButtonElement = fixture.debugElement.query(
      By.css('.boton-activar'),
    ).nativeElement;
    botonActivar.click();

    const activarReq = httpMock.expectOne(`${environment.apiUrl}/turnos/1/activar`);
    expect(activarReq.request.method).toBe('POST');
    activarReq.flush({ ...turnoPendiente, estado: 'Activado' });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Activado');
    expect(fixture.debugElement.query(By.css('.boton-activar'))).toBeNull();
  });
});
