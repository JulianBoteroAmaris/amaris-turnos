using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Auth;

public interface IJwtTokenGenerator
{
    string GenerarToken(Usuario usuario);
}
