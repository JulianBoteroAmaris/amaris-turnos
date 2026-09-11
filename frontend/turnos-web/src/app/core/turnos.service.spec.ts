import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Turno } from '../shared/models/turno.model';
import { TurnosService } from './turnos.service';

describe('TurnosService', () => {
  let service: TurnosService;
  let httpMock: HttpTestingController;

  const turnoEjemplo: Turno = {
    id: 1,
    numeroTurno: 5,
    cedulaCliente: '1023456789',
    sucursalId: 2,
    sucursalNombre: 'Sucursal Centro',
    estado: 'Pendiente',
    fechaHoraCreacion: '2026-09-11T10:00:00Z',
    fechaHoraExpiracion: '2026-09-11T10:15:00Z',
    fechaHoraActivacion: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TurnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envía POST a /turnos al crear un turno', () => {
    service.crear({ cedula: '1023456789', sucursalId: 2 }).subscribe((turno) => {
      expect(turno).toEqual(turnoEjemplo);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ cedula: '1023456789', sucursalId: 2 });
    req.flush(turnoEjemplo);
  });

  it('envía GET a /turnos con filtros como query params', () => {
    service.obtener({ sucursalId: 2, estado: 'Pendiente', cedula: '1023456789' }).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/turnos` &&
        request.params.get('sucursalId') === '2' &&
        request.params.get('estado') === 'Pendiente' &&
        request.params.get('cedula') === '1023456789',
    );
    expect(req.request.method).toBe('GET');
    req.flush([turnoEjemplo]);
  });

  it('envía GET a /turnos sin params cuando no hay filtro', () => {
    service.obtener().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/turnos`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('envía GET a /turnos/{id} al obtener por id', () => {
    service.obtenerPorId(1).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/turnos/1`);
    expect(req.request.method).toBe('GET');
    req.flush(turnoEjemplo);
  });

  it('envía POST a /turnos/{id}/activar al activar un turno', () => {
    service.activar(1).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/turnos/1/activar`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...turnoEjemplo, estado: 'Activado' });
  });
});
