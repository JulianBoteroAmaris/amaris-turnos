using Amaris.Turnos.Domain.Enums;

namespace Amaris.Turnos.Application.Auth;

public record LoginExitoso(string Token, RolUsuario Rol);
