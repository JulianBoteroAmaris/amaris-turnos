import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelojService } from './reloj.service';

@Component({
  selector: 'app-reloj-host-prueba',
  template: '',
  providers: [RelojService],
})
class RelojHostPrueba {
  constructor(readonly reloj: RelojService) {}
}

describe('RelojService', () => {
  let fixture: ComponentFixture<RelojHostPrueba>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RelojHostPrueba] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expone la fecha y hora actual al crearse', () => {
    fixture = TestBed.createComponent(RelojHostPrueba);
    fixture.detectChanges();

    expect(fixture.componentInstance.reloj.ahora()).toBeInstanceOf(Date);
  });

  it('actualiza la fecha y hora cada segundo', () => {
    vi.useFakeTimers();
    const instante = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(instante);

    fixture = TestBed.createComponent(RelojHostPrueba);
    fixture.detectChanges();

    expect(fixture.componentInstance.reloj.ahora().getTime()).toBe(instante.getTime());

    vi.advanceTimersByTime(3000);

    expect(fixture.componentInstance.reloj.ahora().getTime()).toBe(instante.getTime() + 3000);
  });

  it('detiene el intervalo al destruirse el componente que lo provee', () => {
    vi.useFakeTimers();
    const instante = new Date('2026-01-01T10:00:00Z');
    vi.setSystemTime(instante);

    fixture = TestBed.createComponent(RelojHostPrueba);
    fixture.detectChanges();

    fixture.destroy();
    vi.advanceTimersByTime(5000);

    expect(fixture.componentInstance.reloj.ahora().getTime()).toBe(instante.getTime());
  });
});
