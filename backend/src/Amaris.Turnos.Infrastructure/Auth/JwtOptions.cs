namespace Amaris.Turnos.Infrastructure.Auth;

public class JwtOptions
{
    public const string SeccionConfiguracion = "Jwt";

    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiracionMinutos { get; set; } = 60;
}
