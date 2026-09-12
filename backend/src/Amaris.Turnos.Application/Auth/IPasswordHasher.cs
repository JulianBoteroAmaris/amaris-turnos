namespace Amaris.Turnos.Application.Auth;

public interface IPasswordHasher
{
    string GenerarHash(string password);

    bool VerificarHash(string passwordHash, string password);
}
