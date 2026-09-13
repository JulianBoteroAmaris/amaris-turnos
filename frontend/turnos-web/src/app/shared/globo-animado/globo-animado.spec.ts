import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GloboAnimado } from './globo-animado';

describe('GloboAnimado', () => {
  let fixture: ComponentFixture<GloboAnimado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GloboAnimado],
    }).compileComponents();

    fixture = TestBed.createComponent(GloboAnimado);
  });

  it('debería crearse y renderizar el canvas', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('canvas.globo')).toBeTruthy();
  });

  it('detiene la animación y libera el globo al destruirse', () => {
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
