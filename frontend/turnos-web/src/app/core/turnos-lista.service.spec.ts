import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Turno } from '../shared/models/turno.model';
import { TurnosListaService } from './turnos-lista.service';

@Component({
  selector: 'app-turnos-lista-host-prueba',
  template: '',
  providers: [TurnosListaService],
})
class TurnosListaHostPrueba {
  constructor(readonly turnosLista: TurnosListaService) {}
}

describe('TurnosListaService', () => {
  let fixture: ComponentFixture<TurnosListaHostPrueba>;
  let httpMock: HttpTestingController;

  const turno: Turno = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TurnosListaHostPrueba],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(TurnosListaHostPrueba);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('inicia sin turnos y sin error', () => {
    const { turnosLista } = fixture.componentInstance;
    expect(turnosLista.turnos()).toEqual([]);
    expect(turnosLista.cargando()).toBe(false);
    expect(turnosLista.error()).toBeNull();
  });

  it('carga los turnos y actualiza los signals de estado', () => {
    const { turnosLista } = fixture.componentInstance;
    turnosLista.cargar();
    expect(turnosLista.cargando()).toBe(true);

    httpMock.expectOne(`${environment.apiUrl}/turnos`).flush([turno]);

    expect(turnosLista.cargando()).toBe(false);
    expect(turnosLista.turnos()).toEqual([turno]);
    expect(turnosLista.error()).toBeNull();
  });

  it('expone el mensaje de error cuando la carga falla', () => {
    const { turnosLista } = fixture.componentInstance;
    turnosLista.cargar();

    httpMock
      .expectOne(`${environment.apiUrl}/turnos`)
      .flush(
        { mensaje: 'No se pudieron cargar los turnos.' },
        { status: 500, statusText: 'Error' },
      );

    expect(turnosLista.cargando()).toBe(false);
    expect(turnosLista.error()).toBe('No se pudieron cargar los turnos.');
  });
});
