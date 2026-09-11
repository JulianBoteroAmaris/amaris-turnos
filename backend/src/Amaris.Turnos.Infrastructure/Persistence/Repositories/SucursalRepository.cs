using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Amaris.Turnos.Infrastructure.Persistence.Repositories;

public class SucursalRepository : ISucursalRepository
{
    private readonly TurnosDbContext _dbContext;

    public SucursalRepository(TurnosDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Sucursal?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
        _dbContext.Sucursales.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Sucursal>> ObtenerTodasAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Sucursales.AsNoTracking().OrderBy(s => s.Nombre).ToListAsync(cancellationToken);
}
