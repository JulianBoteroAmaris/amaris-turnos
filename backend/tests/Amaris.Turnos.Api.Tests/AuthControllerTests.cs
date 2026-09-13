using Amaris.Turnos.Api.Auth;
using Amaris.Turnos.Api.Controllers;
using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Application.Common;
using Amaris.Turnos.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Shouldly;

namespace Amaris.Turnos.Api.Tests;

public class AuthControllerTests
{
    private readonly IAuthService _authService = Substitute.For<IAuthService>();

    private AuthController CrearController() => new(_authService);

    [Fact]
    public async Task Login_ConCredencialesValidas_Retorna200ConTokenYRol()
    {
        _authService.LoginAsync("admin", "Admin123!", Arg.Any<CancellationToken>())
            .Returns(Result<LoginExitoso, LoginError>.Exitoso(new LoginExitoso("token-generado", RolUsuario.Administrador)));

        var resultado = await CrearController().Login(new LoginRequest("admin", "Admin123!"), CancellationToken.None);

        var ok = resultado.Result.ShouldBeOfType<OkObjectResult>();
        ok.StatusCode.ShouldBe(StatusCodes.Status200OK);
        var response = ok.Value.ShouldBeOfType<LoginResponse>();
        response.Token.ShouldBe("token-generado");
        response.Rol.ShouldBe(nameof(RolUsuario.Administrador));
    }

    [Fact]
    public async Task Login_ConCredencialesInvalidas_Retorna401()
    {
        _authService.LoginAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Result<LoginExitoso, LoginError>.Fallido(LoginError.CredencialesInvalidas, "Credenciales invalidas"));

        var resultado = await CrearController().Login(new LoginRequest("admin", "incorrecta"), CancellationToken.None);

        var unauthorized = resultado.Result.ShouldBeOfType<UnauthorizedObjectResult>();
        unauthorized.StatusCode.ShouldBe(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task Login_ConUsuarioOPasswordVacios_Retorna400()
    {
        _authService.LoginAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(Result<LoginExitoso, LoginError>.Fallido(LoginError.EntradaInvalida, "Usuario y password son requeridos"));

        var resultado = await CrearController().Login(new LoginRequest("", ""), CancellationToken.None);

        var badRequest = resultado.Result.ShouldBeOfType<BadRequestObjectResult>();
        badRequest.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }
}
