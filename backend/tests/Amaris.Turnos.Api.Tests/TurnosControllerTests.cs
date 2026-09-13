using Amaris.Turnos.Api.Controllers;
using Amaris.Turnos.Api.Turnos;
using Amaris.Turnos.Application.Common;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Application.Turnos;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Shouldly;

namespace Amaris.Turnos.Api.Tests;

public class TurnosControllerTests
{
    private readonly ITurnoService _turnoService = Substitute.For<ITurnoService>();

    private TurnosController CrearController() => new(_turnoService);

    private static Turno CrearTurno(
        int id = 1,
        int numeroTurno = 10,
        string cedula = "123456789",
        int sucursalId = 1,
        EstadoTurno estado = EstadoTurno.Pendiente) => new()
    {
        Id = id,
        NumeroTurno = numeroTurno,
        CedulaCliente = cedula,
        SucursalId = sucursalId,
        Estado = estado,
        FechaHoraCreacion = DateTime.UtcNow,
        FechaHoraExpiracion = DateTime.UtcNow.AddMinutes(15)
    };

    [Fact]
    public async Task Crear_ConDatosValidos_Retorna201ConTurno()
    {
        var turno = CrearTurno();
        _turnoService.CrearTurnoAsync("123456789", 1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CrearTurnoError>.Exitoso(turno));

        var resultado = await CrearController().Crear(new CrearTurnoRequest("123456789", 1), CancellationToken.None);

        var creado = resultado.Result.ShouldBeOfType<CreatedAtActionResult>();
        creado.StatusCode.ShouldBe(StatusCodes.Status201Created);
        creado.ActionName.ShouldBe(nameof(TurnosController.ObtenerPorId));
        var response = creado.Value.ShouldBeOfType<TurnoResponse>();
        response.Id.ShouldBe(turno.Id);
    }

    [Fact]
    public async Task Crear_ConCedulaInvalida_Retorna400()
    {
        _turnoService.CrearTurnoAsync(Arg.Any<string>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CrearTurnoError>.Fallido(CrearTurnoError.CedulaInvalida, "Cedula invalida"));

        var resultado = await CrearController().Crear(new CrearTurnoRequest("abc", 1), CancellationToken.None);

        var badRequest = resultado.Result.ShouldBeOfType<BadRequestObjectResult>();
        badRequest.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Crear_ConSucursalInvalida_Retorna400()
    {
        _turnoService.CrearTurnoAsync(Arg.Any<string>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CrearTurnoError>.Fallido(CrearTurnoError.SucursalInvalida, "Sucursal invalida"));

        var resultado = await CrearController().Crear(new CrearTurnoRequest("123456789", 999), CancellationToken.None);

        var badRequest = resultado.Result.ShouldBeOfType<BadRequestObjectResult>();
        badRequest.StatusCode.ShouldBe(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task Crear_ConLimiteDiarioExcedido_Retorna409()
    {
        _turnoService.CrearTurnoAsync(Arg.Any<string>(), Arg.Any<int>(), Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CrearTurnoError>.Fallido(CrearTurnoError.LimiteDiarioExcedido, "Limite diario excedido"));

        var resultado = await CrearController().Crear(new CrearTurnoRequest("123456789", 1), CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task ObtenerPorId_ConTurnoExistente_Retorna200()
    {
        var turno = CrearTurno(id: 5);
        _turnoService.ObtenerTurnoPorIdAsync(5, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearController().ObtenerPorId(5, CancellationToken.None);

        var ok = resultado.Result.ShouldBeOfType<OkObjectResult>();
        ok.StatusCode.ShouldBe(StatusCodes.Status200OK);
        var response = ok.Value.ShouldBeOfType<TurnoResponse>();
        response.Id.ShouldBe(5);
    }

    [Fact]
    public async Task ObtenerPorId_ConTurnoInexistente_Retorna404()
    {
        _turnoService.ObtenerTurnoPorIdAsync(999, Arg.Any<CancellationToken>()).Returns((Turno?)null);

        var resultado = await CrearController().ObtenerPorId(999, CancellationToken.None);

        var notFound = resultado.Result.ShouldBeOfType<NotFoundObjectResult>();
        notFound.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Activar_Exitoso_Retorna200()
    {
        var turno = CrearTurno(estado: EstadoTurno.Activado);
        _turnoService.ActivarTurnoAsync(1, Arg.Any<CancellationToken>()).Returns(Result<Turno, ActivarTurnoError>.Exitoso(turno));

        var resultado = await CrearController().Activar(1, CancellationToken.None);

        var ok = resultado.Result.ShouldBeOfType<OkObjectResult>();
        ok.StatusCode.ShouldBe(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task Activar_NoEncontrado_Retorna404()
    {
        _turnoService.ActivarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, ActivarTurnoError>.Fallido(ActivarTurnoError.NoEncontrado, "No existe"));

        var resultado = await CrearController().Activar(1, CancellationToken.None);

        var notFound = resultado.Result.ShouldBeOfType<NotFoundObjectResult>();
        notFound.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Activar_ConEstadoNoPendiente_Retorna409()
    {
        _turnoService.ActivarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, ActivarTurnoError>.Fallido(ActivarTurnoError.EstadoNoPendiente, "Ya fue activado"));

        var resultado = await CrearController().Activar(1, CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Activar_ConTurnoExpirado_Retorna409()
    {
        _turnoService.ActivarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, ActivarTurnoError>.Fallido(ActivarTurnoError.Expirado, "El turno expiro"));

        var resultado = await CrearController().Activar(1, CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Activar_ConConflictoDeConcurrencia_Retorna409()
    {
        _turnoService.ActivarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, ActivarTurnoError>.Fallido(ActivarTurnoError.ConflictoConcurrencia, "Conflicto de concurrencia"));

        var resultado = await CrearController().Activar(1, CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Cancelar_Exitoso_Retorna200()
    {
        var turno = CrearTurno(estado: EstadoTurno.Cancelado);
        _turnoService.CancelarTurnoAsync(1, Arg.Any<CancellationToken>()).Returns(Result<Turno, CancelarTurnoError>.Exitoso(turno));

        var resultado = await CrearController().Cancelar(1, CancellationToken.None);

        var ok = resultado.Result.ShouldBeOfType<OkObjectResult>();
        ok.StatusCode.ShouldBe(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task Cancelar_NoEncontrado_Retorna404()
    {
        _turnoService.CancelarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CancelarTurnoError>.Fallido(CancelarTurnoError.NoEncontrado, "No existe"));

        var resultado = await CrearController().Cancelar(1, CancellationToken.None);

        var notFound = resultado.Result.ShouldBeOfType<NotFoundObjectResult>();
        notFound.StatusCode.ShouldBe(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Cancelar_ConEstadoNoPendiente_Retorna409()
    {
        _turnoService.CancelarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CancelarTurnoError>.Fallido(CancelarTurnoError.EstadoNoPendiente, "No se puede cancelar"));

        var resultado = await CrearController().Cancelar(1, CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Cancelar_ConConflictoDeConcurrencia_Retorna409()
    {
        _turnoService.CancelarTurnoAsync(1, Arg.Any<CancellationToken>())
            .Returns(Result<Turno, CancelarTurnoError>.Fallido(CancelarTurnoError.ConflictoConcurrencia, "Conflicto de concurrencia"));

        var resultado = await CrearController().Cancelar(1, CancellationToken.None);

        var conflicto = resultado.Result.ShouldBeOfType<ConflictObjectResult>();
        conflicto.StatusCode.ShouldBe(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task Obtener_ConFiltros_LosPasaAlServicio()
    {
        var fecha = new DateTime(2026, 9, 13);
        _turnoService.ObtenerTurnosAsync(Arg.Any<FiltroTurnos>(), Arg.Any<CancellationToken>())
            .Returns(new List<Turno> { CrearTurno() });

        var resultado = await CrearController().Obtener(2, EstadoTurno.Pendiente, fecha, "123456789", CancellationToken.None);

        resultado.Result.ShouldBeOfType<OkObjectResult>();
        await _turnoService.Received(1).ObtenerTurnosAsync(
            Arg.Is<FiltroTurnos>(f =>
                f.SucursalId == 2 &&
                f.Estado == EstadoTurno.Pendiente &&
                f.Fecha == fecha &&
                f.Cedula == "123456789"),
            Arg.Any<CancellationToken>());
    }
}
