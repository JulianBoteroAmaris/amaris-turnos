using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Sucursales;

public class SucursalService : ISucursalService
{
    private readonly ISucursalRepository _sucursalRepository;

    public SucursalService(ISucursalRepository sucursalRepository)
    {
        _sucursalRepository = sucursalRepository;
    }

    public Task<IReadOnlyList<Sucursal>> ObtenerTodasAsync(CancellationToken cancellationToken = default) =>
        _sucursalRepository.ObtenerTodasAsync(cancellationToken);
}
