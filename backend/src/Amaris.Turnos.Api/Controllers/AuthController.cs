using Amaris.Turnos.Api.Auth;
using Amaris.Turnos.Api.Common;
using Amaris.Turnos.Application.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Amaris.Turnos.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var resultado = await _authService.LoginAsync(request.NombreUsuario, request.Password, cancellationToken);

        return this.ToActionResult<LoginExitoso, LoginError, LoginResponse>(
            resultado,
            exito => Ok(new LoginResponse(exito.Token, exito.Rol.ToString())),
            error => error switch
            {
                LoginError.EntradaInvalida => BadRequest(new { mensaje = resultado.MensajeError }),
                LoginError.CredencialesInvalidas => Unauthorized(new { mensaje = resultado.MensajeError }),
                _ => Problem(resultado.MensajeError)
            });
    }
}
