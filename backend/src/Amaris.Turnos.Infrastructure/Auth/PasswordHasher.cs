using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Amaris.Turnos.Infrastructure.Auth;

public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

    public string GenerarHash(string password) =>
        _passwordHasher.HashPassword(new Usuario(), password);

    public bool VerificarHash(string passwordHash, string password)
    {
        var resultado = _passwordHasher.VerifyHashedPassword(new Usuario(), passwordHash, password);
        return resultado is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
