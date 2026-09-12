using System.Text.RegularExpressions;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;

namespace Amaris.Turnos.Application.Turnos;

public class TurnoService : ITurnoService
{
    private const int LimiteTurnosDiariosPorCedula = 5;
    private const int MinutosExpiracion = 15;

    private static readonly Regex CedulaRegex = new("^[0-9]{6,15}$", RegexOptions.Compiled);

    private readonly ITurnoRepository _turnoRepository;
    private readonly ISucursalRepository _sucursalRepository;
    private readonly IUnitOfWork _unitOfWork;

    public TurnoService(ITurnoRepository turnoRepository, ISucursalRepository sucursalRepository, IUnitOfWork unitOfWork)
    {
        _turnoRepository = turnoRepository;
        _sucursalRepository = sucursalRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<CrearTurnoResultado> CrearTurnoAsync(string cedula, int sucursalId, CancellationToken cancellationToken = default)
    {
        var cedulaNormalizada = (cedula ?? string.Empty).Trim();

        if (!CedulaRegex.IsMatch(cedulaNormalizada))
        {
            return CrearTurnoResultado.Fallido(
                CrearTurnoError.CedulaInvalida,
                "La cédula debe contener solo dígitos, entre 6 y 15 caracteres.");
        }

        var sucursal = await _sucursalRepository.ObtenerPorIdAsync(sucursalId, cancellationToken);
        if (sucursal is null || !sucursal.Activa)
        {
            return CrearTurnoResultado.Fallido(
                CrearTurnoError.SucursalInvalida,
                "La sucursal indicada no existe o no está activa.");
        }

        return await _unitOfWork.EjecutarTransaccionSerializableAsync(async ct =>
        {
            var ahora = DateTime.UtcNow;

            var turnosCedulaHoy = await _turnoRepository.ContarTurnosCedulaDelDiaAsync(cedulaNormalizada, ahora, ct);
            if (turnosCedulaHoy >= LimiteTurnosDiariosPorCedula)
            {
                return CrearTurnoResultado.Fallido(
                    CrearTurnoError.LimiteDiarioExcedido,
                    $"La cédula {cedulaNormalizada} ya alcanzó el máximo de {LimiteTurnosDiariosPorCedula} turnos solicitados hoy.");
            }

            var turnosSucursalHoy = await _turnoRepository.ContarTurnosSucursalDelDiaAsync(sucursalId, ahora, ct);

            var turno = new Turno
            {
                NumeroTurno = turnosSucursalHoy + 1,
                CedulaCliente = cedulaNormalizada,
                SucursalId = sucursalId,
                FechaHoraCreacion = ahora,
                FechaHoraExpiracion = ahora.AddMinutes(MinutosExpiracion),
                Estado = EstadoTurno.Pendiente
            };

            await _turnoRepository.AgregarAsync(turno, ct);
            await _unitOfWork.GuardarCambiosAsync(ct);

            return CrearTurnoResultado.Exitoso(turno);
        }, cancellationToken);
    }

    public Task<IReadOnlyList<Turno>> ObtenerTurnosAsync(FiltroTurnos filtro, CancellationToken cancellationToken = default) =>
        _turnoRepository.ObtenerAsync(filtro, cancellationToken);

    public Task<Turno?> ObtenerTurnoPorIdAsync(int id, CancellationToken cancellationToken = default) =>
        _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);

    public async Task<ActivarTurnoResultado> ActivarTurnoAsync(int id, CancellationToken cancellationToken = default)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (turno is null)
        {
            return ActivarTurnoResultado.Fallido(ActivarTurnoError.NoEncontrado, "El turno no existe.");
        }

        if (turno.Estado != EstadoTurno.Pendiente)
        {
            return ActivarTurnoResultado.Fallido(
                ActivarTurnoError.EstadoNoPendiente,
                "El turno no está en estado pendiente y no puede activarse.");
        }

        var ahora = DateTime.UtcNow;
        if (turno.FechaHoraExpiracion <= ahora)
        {
            turno.Estado = EstadoTurno.Expirado;
            await _unitOfWork.GuardarCambiosAsync(cancellationToken);

            return ActivarTurnoResultado.Fallido(
                ActivarTurnoError.Expirado,
                "El turno ya expiró y no puede activarse.");
        }

        turno.Estado = EstadoTurno.Activado;
        turno.FechaHoraActivacion = ahora;
        await _unitOfWork.GuardarCambiosAsync(cancellationToken);

        return ActivarTurnoResultado.Exitoso(turno);
    }

    public async Task<CancelarTurnoResultado> CancelarTurnoAsync(int id, CancellationToken cancellationToken = default)
    {
        var turno = await _turnoRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (turno is null)
        {
            return CancelarTurnoResultado.Fallido(CancelarTurnoError.NoEncontrado, "El turno no existe.");
        }

        if (turno.Estado != EstadoTurno.Pendiente)
        {
            return CancelarTurnoResultado.Fallido(
                CancelarTurnoError.EstadoNoPendiente,
                "El turno no está en estado pendiente y no puede cancelarse.");
        }

        turno.Estado = EstadoTurno.Cancelado;
        await _unitOfWork.GuardarCambiosAsync(cancellationToken);

        return CancelarTurnoResultado.Exitoso(turno);
    }
}
