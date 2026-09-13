import { HttpErrorResponse } from '@angular/common/http';

export function extraerMensajeError(error: HttpErrorResponse, mensajePorDefecto: string): string {
  if (typeof error.error?.mensaje === 'string') {
    return error.error.mensaje;
  }
  if (typeof error.error?.detail === 'string') {
    return error.error.detail;
  }
  if (typeof error.error?.title === 'string') {
    return error.error.title;
  }
  return error.message || mensajePorDefecto;
}
