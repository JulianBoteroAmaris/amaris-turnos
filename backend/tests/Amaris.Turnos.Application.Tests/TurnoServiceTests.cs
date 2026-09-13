using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Application.Turnos;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using NSubstitute;
using Shouldly;

namespace Amaris.Turnos.Application.Tests;

public class TurnoServiceTests
{
    private readonly ITurnoRepository _turnoRepository = Substitute.For<ITurnoRepository>();
    private readonly ISucursalRepository _sucursalRepository = Substitute.For<ISucursalRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    public TurnoServiceTests()
    {
        _unitOfWork.EjecutarTransaccionSerializableAsync(
                Arg.Any<Func<CancellationToken, Task<CrearTurnoResultado>>>(),
                Arg.Any<CancellationToken>())
            .Returns(callInfo => callInfo.Arg<Func<CancellationToken, Task<CrearTurnoResultado>>>()(callInfo.ArgAt<CancellationToken>(1)));
    }

    private TurnoService CrearServicio() => new(_turnoRepository, _sucursalRepository, _unitOfWork);

    [Theory]
    [InlineData("")]
    [InlineData("abc123")]
    [InlineData("123")]
    [InlineData("1234567890123456")]
    public async Task CrearTurnoAsync_ConCedulaInvalida_RetornaCedulaInvalida(string cedula)
    {
        var resultado = await CrearServicio().CrearTurnoAsync(cedula, 1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CrearTurnoError.CedulaInvalida);
        await _sucursalRepository.DidNotReceive().ObtenerPorIdAsync(Arg.Any<int>(), Arg.Any<CancellationToken>());
        await _turnoRepository.DidNotReceive().AgregarAsync(Arg.Any<Turno>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CrearTurnoAsync_ConSucursalInexistente_RetornaSucursalInvalida()
    {
        _sucursalRepository.ObtenerPorIdAsync(99, Arg.Any<CancellationToken>()).Returns((Sucursal?)null);

        var resultado = await CrearServicio().CrearTurnoAsync("123456", 99);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CrearTurnoError.SucursalInvalida);
        await _turnoRepository.DidNotReceive().AgregarAsync(Arg.Any<Turno>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CrearTurnoAsync_ConSucursalInactiva_RetornaSucursalInvalida()
    {
        var sucursal = new Sucursal { Id = 1, Activa = false };
        _sucursalRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(sucursal);

        var resultado = await CrearServicio().CrearTurnoAsync("123456", 1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CrearTurnoError.SucursalInvalida);
        await _turnoRepository.DidNotReceive().AgregarAsync(Arg.Any<Turno>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CrearTurnoAsync_ConCuatroTurnosHoy_PermiteCrearQuintoTurno()
    {
        var sucursal = new Sucursal { Id = 1, Activa = true };
        _sucursalRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(sucursal);
        _turnoRepository.ContarTurnosCedulaDelDiaAsync("123456", Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(4);
        _turnoRepository.ContarTurnosSucursalDelDiaAsync(1, Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(0);

        var resultado = await CrearServicio().CrearTurnoAsync("123456", 1);

        resultado.EsExitoso.ShouldBeTrue();
        resultado.Turno.ShouldNotBeNull();
        await _turnoRepository.Received(1).AgregarAsync(Arg.Any<Turno>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CrearTurnoAsync_ConCincoTurnosHoy_RetornaLimiteDiarioExcedido()
    {
        var sucursal = new Sucursal { Id = 1, Activa = true };
        _sucursalRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(sucursal);
        _turnoRepository.ContarTurnosCedulaDelDiaAsync("123456", Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(5);

        var resultado = await CrearServicio().CrearTurnoAsync("123456", 1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CrearTurnoError.LimiteDiarioExcedido);
        await _turnoRepository.DidNotReceive().AgregarAsync(Arg.Any<Turno>(), Arg.Any<CancellationToken>());
        await _unitOfWork.DidNotReceive().GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CrearTurnoAsync_CalculaNumeroTurnoSegunTurnosSucursalDelDia()
    {
        var sucursal = new Sucursal { Id = 1, Activa = true };
        _sucursalRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(sucursal);
        _turnoRepository.ContarTurnosCedulaDelDiaAsync(Arg.Any<string>(), Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(0);
        _turnoRepository.ContarTurnosSucursalDelDiaAsync(1, Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(7);

        var resultado = await CrearServicio().CrearTurnoAsync("123456", 1);

        resultado.EsExitoso.ShouldBeTrue();
        resultado.Turno!.NumeroTurno.ShouldBe(8);
    }

    [Fact]
    public async Task CrearTurnoAsync_ConDatosValidos_ConfiguraExpiracionYEstadoPendiente()
    {
        var sucursal = new Sucursal { Id = 1, Activa = true };
        _sucursalRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(sucursal);
        _turnoRepository.ContarTurnosCedulaDelDiaAsync(Arg.Any<string>(), Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(0);
        _turnoRepository.ContarTurnosSucursalDelDiaAsync(1, Arg.Any<DateTime>(), Arg.Any<CancellationToken>())
            .Returns(0);

        var antes = DateTime.UtcNow;
        var resultado = await CrearServicio().CrearTurnoAsync("123456", 1);
        var despues = DateTime.UtcNow;

        resultado.EsExitoso.ShouldBeTrue();
        var turno = resultado.Turno!;
        turno.Estado.ShouldBe(EstadoTurno.Pendiente);
        turno.FechaHoraCreacion.ShouldBeInRange(antes, despues);
        turno.FechaHoraExpiracion.ShouldBe(turno.FechaHoraCreacion.AddMinutes(15));
    }

    [Fact]
    public async Task ActivarTurnoAsync_ConIdInexistente_RetornaNoEncontrado()
    {
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns((Turno?)null);

        var resultado = await CrearServicio().ActivarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(ActivarTurnoError.NoEncontrado);
        await _unitOfWork.DidNotReceive().GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(EstadoTurno.Activado)]
    [InlineData(EstadoTurno.Expirado)]
    [InlineData(EstadoTurno.Cancelado)]
    public async Task ActivarTurnoAsync_ConEstadoNoPendiente_RetornaEstadoNoPendiente(EstadoTurno estado)
    {
        var turno = new Turno { Id = 1, Estado = estado };
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().ActivarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(ActivarTurnoError.EstadoNoPendiente);
        await _unitOfWork.DidNotReceive().GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ActivarTurnoAsync_ConTurnoPendienteYVentanaVencida_ExpiraElTurnoYRetornaError()
    {
        var turno = new Turno { Id = 1, Estado = EstadoTurno.Pendiente, FechaHoraExpiracion = DateTime.UtcNow.AddMinutes(-1) };
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().ActivarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(ActivarTurnoError.Expirado);
        turno.Estado.ShouldBe(EstadoTurno.Expirado);
        await _unitOfWork.Received(1).GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ActivarTurnoAsync_ConTurnoPendienteDentroDeVentana_ActivaElTurno()
    {
        var turno = new Turno { Id = 1, Estado = EstadoTurno.Pendiente, FechaHoraExpiracion = DateTime.UtcNow.AddMinutes(10) };
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().ActivarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeTrue();
        turno.Estado.ShouldBe(EstadoTurno.Activado);
        turno.FechaHoraActivacion.ShouldNotBeNull();
        await _unitOfWork.Received(1).GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CancelarTurnoAsync_ConIdInexistente_RetornaNoEncontrado()
    {
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns((Turno?)null);

        var resultado = await CrearServicio().CancelarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CancelarTurnoError.NoEncontrado);
        await _unitOfWork.DidNotReceive().GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData(EstadoTurno.Activado)]
    [InlineData(EstadoTurno.Expirado)]
    [InlineData(EstadoTurno.Cancelado)]
    public async Task CancelarTurnoAsync_ConEstadoNoPendiente_RetornaEstadoNoPendiente(EstadoTurno estado)
    {
        var turno = new Turno { Id = 1, Estado = estado };
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().CancelarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeFalse();
        resultado.Error.ShouldBe(CancelarTurnoError.EstadoNoPendiente);
        await _unitOfWork.DidNotReceive().GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task CancelarTurnoAsync_ConTurnoPendiente_CambiaAEstadoCancelado()
    {
        var turno = new Turno { Id = 1, Estado = EstadoTurno.Pendiente, FechaHoraExpiracion = DateTime.UtcNow.AddMinutes(10) };
        _turnoRepository.ObtenerPorIdAsync(1, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().CancelarTurnoAsync(1);

        resultado.EsExitoso.ShouldBeTrue();
        turno.Estado.ShouldBe(EstadoTurno.Cancelado);
        await _unitOfWork.Received(1).GuardarCambiosAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ObtenerTurnosAsync_LlamaAlRepositorioConElFiltroRecibido()
    {
        var filtro = new FiltroTurnos { SucursalId = 1 };
        var turnos = new List<Turno> { new() { Id = 1 } };
        _turnoRepository.ObtenerAsync(filtro, Arg.Any<CancellationToken>()).Returns(turnos);

        var resultado = await CrearServicio().ObtenerTurnosAsync(filtro);

        resultado.ShouldBe(turnos);
    }

    [Fact]
    public async Task ObtenerTurnoPorIdAsync_LlamaAlRepositorioConElIdRecibido()
    {
        var turno = new Turno { Id = 5 };
        _turnoRepository.ObtenerPorIdAsync(5, Arg.Any<CancellationToken>()).Returns(turno);

        var resultado = await CrearServicio().ObtenerTurnoPorIdAsync(5);

        resultado.ShouldBe(turno);
    }
}
