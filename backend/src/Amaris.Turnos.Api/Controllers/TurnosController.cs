using Amaris.Turnos.Api.Common;
using Amaris.Turnos.Api.Turnos;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Application.Turnos;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Amaris.Turnos.Api.Controllers;

[ApiController]
[Route("api/turnos")]
[Authorize]
public class TurnosController : ControllerBase
{
    private readonly ITurnoService _turnoService;

    public TurnosController(ITurnoService turnoService)
    {
        _turnoService = turnoService;
    }

    [HttpPost]
    public async Task<ActionResult<TurnoResponse>> Crear(
        [FromBody] CrearTurnoRequest request,
        CancellationToken cancellationToken)
    {
        var resultado = await _turnoService.CrearTurnoAsync(request.Cedula, request.SucursalId, cancellationToken);

        return this.ToActionResult<Turno, CrearTurnoError, TurnoResponse>(
            resultado,
            turno =>
            {
                var response = TurnoResponse.DesdeEntidad(turno);
                return CreatedAtAction(nameof(ObtenerPorId), new { id = response.Id }, response);
            },
            error => error switch
            {
                CrearTurnoError.CedulaInvalida => BadRequest(new { mensaje = resultado.MensajeError }),
                CrearTurnoError.SucursalInvalida => BadRequest(new { mensaje = resultado.MensajeError }),
                CrearTurnoError.LimiteDiarioExcedido => Conflict(new { mensaje = resultado.MensajeError }),
                _ => Problem(resultado.MensajeError)
            });
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TurnoResponse>>> Obtener(
        [FromQuery] int? sucursalId,
        [FromQuery] EstadoTurno? estado,
        [FromQuery] DateTime? fecha,
        [FromQuery] string? cedula,
        CancellationToken cancellationToken)
    {
        var filtro = new FiltroTurnos
        {
            SucursalId = sucursalId,
            Estado = estado,
            Fecha = fecha,
            Cedula = cedula
        };

        var turnos = await _turnoService.ObtenerTurnosAsync(filtro, cancellationToken);
        return Ok(turnos.Select(TurnoResponse.DesdeEntidad).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TurnoResponse>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var turno = await _turnoService.ObtenerTurnoPorIdAsync(id, cancellationToken);
        if (turno is null)
        {
            return NotFound(new { mensaje = "El turno no existe." });
        }

        return Ok(TurnoResponse.DesdeEntidad(turno));
    }

    [HttpPost("{id:int}/activar")]
    public async Task<ActionResult<TurnoResponse>> Activar(int id, CancellationToken cancellationToken)
    {
        var resultado = await _turnoService.ActivarTurnoAsync(id, cancellationToken);

        return this.ToActionResult<Turno, ActivarTurnoError, TurnoResponse>(
            resultado,
            turno => Ok(TurnoResponse.DesdeEntidad(turno)),
            error => error switch
            {
                ActivarTurnoError.NoEncontrado => NotFound(new { mensaje = resultado.MensajeError }),
                ActivarTurnoError.EstadoNoPendiente => Conflict(new { mensaje = resultado.MensajeError }),
                ActivarTurnoError.Expirado => Conflict(new { mensaje = resultado.MensajeError }),
                ActivarTurnoError.ConflictoConcurrencia => Conflict(new { mensaje = resultado.MensajeError }),
                _ => Problem(resultado.MensajeError)
            });
    }

    [HttpPost("{id:int}/cancelar")]
    [Authorize(Roles = nameof(RolUsuario.Administrador))]
    public async Task<ActionResult<TurnoResponse>> Cancelar(int id, CancellationToken cancellationToken)
    {
        var resultado = await _turnoService.CancelarTurnoAsync(id, cancellationToken);

        return this.ToActionResult<Turno, CancelarTurnoError, TurnoResponse>(
            resultado,
            turno => Ok(TurnoResponse.DesdeEntidad(turno)),
            error => error switch
            {
                CancelarTurnoError.NoEncontrado => NotFound(new { mensaje = resultado.MensajeError }),
                CancelarTurnoError.EstadoNoPendiente => Conflict(new { mensaje = resultado.MensajeError }),
                CancelarTurnoError.ConflictoConcurrencia => Conflict(new { mensaje = resultado.MensajeError }),
                _ => Problem(resultado.MensajeError)
            });
    }
}
