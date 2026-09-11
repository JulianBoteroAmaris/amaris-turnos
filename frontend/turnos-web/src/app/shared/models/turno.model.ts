export type EstadoTurno = 'Pendiente' | 'Activado' | 'Expirado' | 'Cancelado';

export interface Turno {
  id: number;
  numeroTurno: number;
  cedulaCliente: string;
  sucursalId: number;
  sucursalNombre: string | null;
  estado: EstadoTurno;
  fechaHoraCreacion: string;
  fechaHoraExpiracion: string;
  fechaHoraActivacion: string | null;
}

export interface CrearTurnoRequest {
  cedula: string;
  sucursalId: number;
}

export interface FiltroTurnos {
  sucursalId?: number;
  estado?: EstadoTurno;
  fecha?: string;
  cedula?: string;
}
