namespace Amaris.Turnos.Application.Auth;

public interface IAuthService
{
    Task<LoginResultado> LoginAsync(string nombreUsuario, string password, CancellationToken cancellationToken = default);
}
