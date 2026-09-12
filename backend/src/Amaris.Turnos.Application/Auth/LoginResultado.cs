namespace Amaris.Turnos.Application.Auth;

public class LoginResultado
{
    private LoginResultado(bool esExitoso, string? token, LoginError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Token = token;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public string? Token { get; }
    public LoginError? Error { get; }
    public string? MensajeError { get; }

    public static LoginResultado Exitoso(string token) => new(true, token, null, null);

    public static LoginResultado Fallido(LoginError error, string mensajeError) =>
        new(false, null, error, mensajeError);
}
