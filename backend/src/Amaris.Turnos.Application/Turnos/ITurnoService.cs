using Amaris.Turnos.Application.Common;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Turnos;

public interface ITurnoService
{
    Task<Result<Turno, CrearTurnoError>> CrearTurnoAsync(string cedula, int sucursalId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Turno>> ObtenerTurnosAsync(FiltroTurnos filtro, CancellationToken cancellationToken = default);

    Task<Turno?> ObtenerTurnoPorIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Result<Turno, ActivarTurnoError>> ActivarTurnoAsync(int id, CancellationToken cancellationToken = default);

    Task<Result<Turno, CancelarTurnoError>> CancelarTurnoAsync(int id, CancellationToken cancellationToken = default);
}
