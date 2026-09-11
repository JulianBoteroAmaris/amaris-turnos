using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Interfaces;

public interface ITurnoRepository
{
    Task<Turno?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Turno>> ObtenerAsync(FiltroTurnos filtro, CancellationToken cancellationToken = default);

    Task<int> ContarTurnosCedulaDelDiaAsync(string cedula, DateTime fecha, CancellationToken cancellationToken = default);

    Task<int> ContarTurnosSucursalDelDiaAsync(int sucursalId, DateTime fecha, CancellationToken cancellationToken = default);

    Task AgregarAsync(Turno turno, CancellationToken cancellationToken = default);

    Task<int> ExpirarPendientesVencidosAsync(DateTime momento, CancellationToken cancellationToken = default);
}
