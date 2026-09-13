import { Turno } from './models/turno.model';
import { claseEstadoTurno, estadoMostradoTurno, tiempoRestanteTurno } from './turno-estado.util';

describe('turno-estado.util', () => {
  const ahora = new Date('2026-01-01T10:00:00Z');

  const turnoBase: Turno = {
    id: 1,
    numeroTurno: 3,
    cedulaCliente: '1023456789',
    sucursalId: 1,
    sucursalNombre: 'Sucursal Centro',
    estado: 'Pendiente',
    fechaHoraCreacion: ahora.toISOString(),
    fechaHoraExpiracion: new Date(ahora.getTime() + 5 * 60 * 1000).toISOString(),
    fechaHoraActivacion: null,
  };

  describe('estadoMostradoTurno', () => {
    it('retorna el estado tal cual cuando el turno no está Pendiente', () => {
      const turno: Turno = { ...turnoBase, estado: 'Activado' };
      expect(estadoMostradoTurno(turno, ahora)).toBe('Activado');
    });

    it('retorna Pendiente cuando aún no expira', () => {
      expect(estadoMostradoTurno(turnoBase, ahora)).toBe('Pendiente');
    });

    it('retorna Expirado cuando el turno Pendiente ya cumplió su tiempo', () => {
      const turno: Turno = { ...turnoBase, fechaHoraExpiracion: ahora.toISOString() };
      expect(estadoMostradoTurno(turno, ahora)).toBe('Expirado');
    });
  });

  describe('claseEstadoTurno', () => {
    it('retorna la clase correcta para cada estado', () => {
      expect(claseEstadoTurno(turnoBase, ahora)).toBe('badge-pendiente');
      expect(claseEstadoTurno({ ...turnoBase, estado: 'Activado' }, ahora)).toBe('badge-activado');
      expect(claseEstadoTurno({ ...turnoBase, estado: 'Cancelado' }, ahora)).toBe(
        'badge-cancelado',
      );
      expect(
        claseEstadoTurno({ ...turnoBase, fechaHoraExpiracion: ahora.toISOString() }, ahora),
      ).toBe('badge-expirado');
    });
  });

  describe('tiempoRestanteTurno', () => {
    it('calcula el tiempo restante en formato mm:ss', () => {
      const turno: Turno = {
        ...turnoBase,
        fechaHoraExpiracion: new Date(ahora.getTime() + 5 * 60 * 1000 + 30 * 1000).toISOString(),
      };
      expect(tiempoRestanteTurno(turno, ahora)).toBe('05:30');
    });

    it('retorna 00:00 cuando ya no queda tiempo', () => {
      const turno: Turno = { ...turnoBase, fechaHoraExpiracion: ahora.toISOString() };
      expect(tiempoRestanteTurno(turno, ahora)).toBe('00:00');
    });
  });
});
