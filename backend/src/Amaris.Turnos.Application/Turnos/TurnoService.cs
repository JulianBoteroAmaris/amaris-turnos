using System.Text.RegularExpressions;
using Amaris.Turnos.Application.Common;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using Microsoft.Extensions.Options;

namespace Amaris.Turnos.Application.Turnos;

public class TurnoService : ITurnoService
{
    private static readonly Regex CedulaRegex = new("^[0-9]{6,15}$", RegexOptions.Compiled);

    private readonly ITurnoRepository _turnoRepository;
    private readonly ISucursalRepository _sucursalRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TurnoOptions _opciones;

    public TurnoService(
        ITurnoRepository turnoRepository,
        ISucursalRepository sucursalRepository,
        IUnitOfWork unitOfWork,
        IOptions<TurnoOptions> opciones)
    {
        _turnoRepository = turnoRepository;
        _sucursalRepository = sucursalRepository;
        _unitOfWork = unitOfWork;
        _opciones = opciones.Value;
    }

    public async Task<Result<Turno, CrearTurnoError>> CrearTurnoAsync(string cedula, int sucursalId, CancellationToken cancellationToken = default)
    {
        var cedulaNormalizada = (cedula ?? string.Empty).Trim();

        if (!CedulaRegex.IsMatch(cedulaNormalizada))
        {
            return Result<Turno, CrearTurnoError>.Fallido(
                CrearTurnoError.CedulaInvalida,
                "La cédula debe contener solo dígitos, entre 6 y 15 caracteres.");
        }

        var sucursal = await _sucursalRepository.ObtenerPorIdAsync(sucursalId, cancellationToken);
        if (sucursal is null || !sucursal.Activa)
        {
            return Result<Turno, CrearTurnoError>.Fallido(
                CrearTurnoError.SucursalInvalida,
                "La sucursal indicada no existe o no está activa.");
        }

        return await _unitOfWork.EjecutarTransaccionSerializableAsync(async ct =>
        {
            var ahora = DateTime.UtcNow;

            var turnosCedulaHoy = await _turnoRepository.ContarTurnosCedulaDelDiaAsync(cedulaNormalizada, ahora, ct);
            if (turnosCedulaHoy >= _opciones.LimiteTurnosDiariosPorCedula)
            {
                return Result<Turno, CrearTurnoError>.Fallido(
                    CrearTurnoError.LimiteDiarioExcedido,
                    $"La cédula {cedulaNormalizada} ya alcanzó el máximo de {_opciones.LimiteTurnosDiariosPorCedula} turnos solicitados hoy.");
            }

            var turnosSucursalHoy = await _turnoRepository.ContarTurnosSucursalDelDiaAsync(sucursalId, ahora, ct);

            var turno = new Turno
            {
                NumeroTurno = turnosSucursalHoy + 1,
                CedulaCliente = cedulaNormalizada,
                SucursalId = sucursalId,
                FechaHoraCreacion = ahora,
                FechaHoraExpiracion = ahora.AddMinutes(_opciones.MinutosExpiracion),
                Estado = EstadoTurno.Pendiente
            };

            await _turnoRepository.AgregarAsync(turno, ct);
            await _unitOfWork.GuardarCambiosAsync(ct);

            return Result<Turno, CrearTurnoError>.Exitoso(turno);
        }, cancellationToken);
    }

    public Task<IReadOnlyList<Turno>> ObtenerTurnosAsync(FiltroTurnos filtro, CancellationToken cancellationToken = default) =>
        _turnoRepository.ObtenerAsync(filtro, cancellationToken);

    public Task<Turno?> ObtenerTurnoPorIdAsync(int id, CancellationToken cancellationToken = default) =>
        _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);

    public async Task<Result<Turno, ActivarTurnoError>> ActivarTurnoAsync(int id, CancellationToken cancellationToken = default)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (turno is null)
        {
            return Result<Turno, ActivarTurnoError>.Fallido(ActivarTurnoError.NoEncontrado, "El turno no existe.");
        }

        if (turno.Estado != EstadoTurno.Pendiente)
        {
            return Result<Turno, ActivarTurnoError>.Fallido(
                ActivarTurnoError.EstadoNoPendiente,
                "El turno no está en estado pendiente y no puede activarse.");
        }

        var ahora = DateTime.UtcNow;
        if (turno.FechaHoraExpiracion <= ahora)
        {
            turno.Estado = EstadoTurno.Expirado;
            await _unitOfWork.GuardarCambiosAsync(cancellationToken);

            return Result<Turno, ActivarTurnoError>.Fallido(
                ActivarTurnoError.Expirado,
                "El turno ya expiró y no puede activarse.");
        }

        turno.Estado = EstadoTurno.Activado;
        turno.FechaHoraActivacion = ahora;

        var guardadoExitoso = await _unitOfWork.IntentarGuardarCambiosAsync(cancellationToken);
        if (!guardadoExitoso)
        {
            return Result<Turno, ActivarTurnoError>.Fallido(
                ActivarTurnoError.ConflictoConcurrencia,
                "El turno fue modificado por otra operación. Intenta nuevamente.");
        }

        return Result<Turno, ActivarTurnoError>.Exitoso(turno);
    }

    public async Task<Result<Turno, CancelarTurnoError>> CancelarTurnoAsync(int id, CancellationToken cancellationToken = default)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (turno is null)
        {
            return Result<Turno, CancelarTurnoError>.Fallido(CancelarTurnoError.NoEncontrado, "El turno no existe.");
        }

        if (turno.Estado != EstadoTurno.Pendiente)
        {
            return Result<Turno, CancelarTurnoError>.Fallido(
                CancelarTurnoError.EstadoNoPendiente,
                "El turno no está en estado pendiente y no puede cancelarse.");
        }

        turno.Estado = EstadoTurno.Cancelado;

        var guardadoExitoso = await _unitOfWork.IntentarGuardarCambiosAsync(cancellationToken);
        if (!guardadoExitoso)
        {
            return Result<Turno, CancelarTurnoError>.Fallido(
                CancelarTurnoError.ConflictoConcurrencia,
                "El turno fue modificado por otra operación. Intenta nuevamente.");
        }

        return Result<Turno, CancelarTurnoError>.Exitoso(turno);
    }
}
