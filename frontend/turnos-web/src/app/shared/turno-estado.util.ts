import { EstadoTurno, Turno } from './models/turno.model';

export function estadoMostradoTurno(turno: Turno, ahora: Date): EstadoTurno {
  if (turno.estado !== 'Pendiente') {
    return turno.estado;
  }

  return new Date(turno.fechaHoraExpiracion) <= ahora ? 'Expirado' : 'Pendiente';
}

export function claseEstadoTurno(turno: Turno, ahora: Date): string {
  switch (estadoMostradoTurno(turno, ahora)) {
    case 'Pendiente':
      return 'badge-pendiente';
    case 'Activado':
      return 'badge-activado';
    case 'Expirado':
      return 'badge-expirado';
    case 'Cancelado':
      return 'badge-cancelado';
    default:
      return '';
  }
}

export function tiempoRestanteTurno(turno: Turno, ahora: Date): string {
  const milisegundosRestantes = new Date(turno.fechaHoraExpiracion).getTime() - ahora.getTime();
  if (milisegundosRestantes <= 0) {
    return '00:00';
  }

  const segundosTotales = Math.floor(milisegundosRestantes / 1000);
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}
