using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Interfaces;

public interface ISucursalRepository
{
    Task<Sucursal?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Sucursal>> ObtenerTodasAsync(CancellationToken cancellationToken = default);
}
