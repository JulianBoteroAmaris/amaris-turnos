export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export type RolUsuario = 'Administrador' | 'Asesor';

export interface LoginResponse {
  token: string;
  rol: RolUsuario;
}
