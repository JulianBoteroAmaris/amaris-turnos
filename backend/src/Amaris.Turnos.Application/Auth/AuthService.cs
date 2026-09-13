using Amaris.Turnos.Application.Common;
using Amaris.Turnos.Application.Interfaces;

namespace Amaris.Turnos.Application.Auth;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(IUsuarioRepository usuarioRepository, IPasswordHasher passwordHasher, IJwtTokenGenerator jwtTokenGenerator)
    {
        _usuarioRepository = usuarioRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<Result<LoginExitoso, LoginError>> LoginAsync(string nombreUsuario, string password, CancellationToken cancellationToken = default)
    {
        var nombreUsuarioNormalizado = (nombreUsuario ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(nombreUsuarioNormalizado) || string.IsNullOrWhiteSpace(password))
        {
            return Result<LoginExitoso, LoginError>.Fallido(LoginError.EntradaInvalida, "Usuario y contraseña son obligatorios.");
        }

        var usuario = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(nombreUsuarioNormalizado, cancellationToken);
        if (usuario is null || !_passwordHasher.VerificarHash(usuario.PasswordHash, password))
        {
            return Result<LoginExitoso, LoginError>.Fallido(LoginError.CredencialesInvalidas, "Usuario o contraseña incorrectos.");
        }

        var token = _jwtTokenGenerator.GenerarToken(usuario);
        return Result<LoginExitoso, LoginError>.Exitoso(new LoginExitoso(token, usuario.Rol));
    }
}
