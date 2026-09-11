import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Sucursal } from '../shared/models/sucursal.model';
import { SucursalesService } from './sucursales.service';

describe('SucursalesService', () => {
  let service: SucursalesService;
  let httpMock: HttpTestingController;

  const sucursalEjemplo: Sucursal = {
    id: 1,
    nombre: 'Sucursal Centro',
    direccion: 'Calle 10 # 20-30',
    ciudad: 'Bogotá',
    activa: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SucursalesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envía GET a /sucursales', () => {
    service.obtener().subscribe((sucursales) => {
      expect(sucursales).toEqual([sucursalEjemplo]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/sucursales`);
    expect(req.request.method).toBe('GET');
    req.flush([sucursalEjemplo]);
  });
});
