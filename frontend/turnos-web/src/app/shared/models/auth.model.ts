export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export type RolUsuario = 'Administrador' | 'Cliente';

export interface LoginResponse {
  token: string;
  rol: RolUsuario;
}
