using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Sucursales;

public interface ISucursalService
{
    Task<IReadOnlyList<Sucursal>> ObtenerTodasAsync(CancellationToken cancellationToken = default);
}
