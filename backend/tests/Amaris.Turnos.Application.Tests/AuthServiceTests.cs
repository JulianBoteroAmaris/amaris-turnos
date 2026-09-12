using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using NSubstitute;
using Shouldly;

namespace Amaris.Turnos.Application.Tests;

public class AuthServiceTests
{
    private readonly IUsuarioRepository _usuarioRepository = Substitute.For<IUsuarioRepository>();
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtTokenGenerator _jwtTokenGenerator = Substitute.For<IJwtTokenGenerator>();

    private AuthService CrearServicio() => new(_usuarioRepository, _passwordHasher, _jwtTokenGenerator);

    [Fact]
    public async Task LoginAsync_ConCredencialesValidas_RetornaTokenExitoso()
    {
        var usuario = new Usuario { Id = 1, NombreUsuario = "admin", PasswordHash = "hash-guardado", Rol = RolUsuario.Administrador };
        _usuarioRepository.ObtenerPorNombreUsuarioAsync("admin", Arg.Any<CancellationToken>())
            .Returns(usuario);
        _passwordHasher.VerificarHash("hash-guardado", "Admin123!").Returns(true);
        _jwtTokenGenerator.GenerarToken(usuario).Returns("token-generado");

        var resultado = await CrearServicio().LoginAsync("admin", "Admin123!");

        resultado.EsExitoso.ShouldBeTrue();
        resultado.Token.ShouldBe("token-generado");
        resultado.Rol.ShouldBe(RolUsuario.Administrador);
        resultado.Error.ShouldBeNull();
    }

    [Fact]
    public async Task LoginAsync_ConUsuarioInexistente_RetornaCredencialesInvalidas()
    {
        _usuarioRepository.ObtenerPorNombreUsuarioAsync("desconocido", Arg.Any<CancellationToken>())
            .Returns((Usuario?)null);

        var resultado = await CrearServicio().LoginAsync("desconocido", "Cualquiera123!");

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(LoginError.CredencialesInvalidas);
        _jwtTokenGenerator.DidNotReceive().GenerarToken(Arg.Any<Usuario>());
    }

    [Fact]
    public async Task LoginAsync_ConPasswordIncorrecta_RetornaCredencialesInvalidas()
    {
        var usuario = new Usuario { Id = 1, NombreUsuario = "admin", PasswordHash = "hash-guardado", Rol = RolUsuario.Administrador };
        _usuarioRepository.ObtenerPorNombreUsuarioAsync("admin", Arg.Any<CancellationToken>())
            .Returns(usuario);
        _passwordHasher.VerificarHash("hash-guardado", "incorrecta").Returns(false);

        var resultado = await CrearServicio().LoginAsync("admin", "incorrecta");

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(LoginError.CredencialesInvalidas);
        _jwtTokenGenerator.DidNotReceive().GenerarToken(Arg.Any<Usuario>());
    }

    [Theory]
    [InlineData("", "Admin123!")]
    [InlineData("admin", "")]
    [InlineData(" ", " ")]
    public async Task LoginAsync_ConEntradaVacia_RetornaEntradaInvalida(string nombreUsuario, string password)
    {
        var resultado = await CrearServicio().LoginAsync(nombreUsuario, password);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(LoginError.EntradaInvalida);
        await _usuarioRepository.DidNotReceive().ObtenerPorNombreUsuarioAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
