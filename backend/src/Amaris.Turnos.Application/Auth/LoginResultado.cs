using Amaris.Turnos.Domain.Enums;

namespace Amaris.Turnos.Application.Auth;

public class LoginResultado
{
    private LoginResultado(bool esExitoso, string? token, RolUsuario? rol, LoginError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Token = token;
        Rol = rol;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public string? Token { get; }
    public RolUsuario? Rol { get; }
    public LoginError? Error { get; }
    public string? MensajeError { get; }

    public static LoginResultado Exitoso(string token, RolUsuario rol) => new(true, token, rol, null, null);

    public static LoginResultado Fallido(LoginError error, string mensajeError) =>
        new(false, null, null, error, mensajeError);
}
