using Amaris.Turnos.Application.Common;

namespace Amaris.Turnos.Application.Auth;

public interface IAuthService
{
    Task<Result<LoginExitoso, LoginError>> LoginAsync(string nombreUsuario, string password, CancellationToken cancellationToken = default);
}
