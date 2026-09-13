import { HttpErrorResponse } from '@angular/common/http';

import { extraerMensajeError } from './http-error.util';

describe('extraerMensajeError', () => {
  const mensajePorDefecto = 'Ocurrió un error inesperado.';

  it('retorna error.error.mensaje cuando está presente', () => {
    const error = new HttpErrorResponse({ error: { mensaje: 'Credenciales inválidas.' } });
    expect(extraerMensajeError(error, mensajePorDefecto)).toBe('Credenciales inválidas.');
  });

  it('retorna error.error.detail cuando no hay mensaje', () => {
    const error = new HttpErrorResponse({ error: { detail: 'Detalle del error.' } });
    expect(extraerMensajeError(error, mensajePorDefecto)).toBe('Detalle del error.');
  });

  it('retorna error.error.title cuando no hay mensaje ni detail', () => {
    const error = new HttpErrorResponse({ error: { title: 'Título del error.' } });
    expect(extraerMensajeError(error, mensajePorDefecto)).toBe('Título del error.');
  });

  it('retorna error.message cuando el cuerpo del error no trae mensaje, detail ni title', () => {
    const error = new HttpErrorResponse({ error: {}, statusText: 'Unknown Error' });
    expect(extraerMensajeError(error, mensajePorDefecto)).toBe(error.message);
  });

  it('retorna el mensaje por defecto cuando no hay ninguna otra fuente de mensaje', () => {
    const error = new HttpErrorResponse({});
    Object.defineProperty(error, 'message', { value: '' });
    expect(extraerMensajeError(error, mensajePorDefecto)).toBe(mensajePorDefecto);
  });
});
