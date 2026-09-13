using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Amaris.Turnos.Infrastructure.Persistence.Repositories;

public class TurnoRepository : ITurnoRepository
{
    private readonly TurnosDbContext _dbContext;

    public TurnoRepository(TurnosDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Turno?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
        _dbContext.Turnos
            .Include(t => t.Sucursal)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Turno>> ObtenerAsync(FiltroTurnos filtro, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Turnos.Include(t => t.Sucursal).AsNoTracking().AsQueryable();

        if (filtro.SucursalId.HasValue)
        {
            query = query.Where(t => t.SucursalId == filtro.SucursalId.Value);
        }

        if (filtro.Estado.HasValue)
        {
            query = query.Where(t => t.Estado == filtro.Estado.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtro.Cedula))
        {
            query = query.Where(t => t.CedulaCliente == filtro.Cedula);
        }

        if (filtro.Fecha.HasValue)
        {
            var (inicio, fin) = RangoDelDia(filtro.Fecha.Value);
            query = query.Where(t => t.FechaHoraCreacion >= inicio && t.FechaHoraCreacion < fin);
        }

        return await query
            .OrderByDescending(t => t.FechaHoraCreacion)
            .ToListAsync(cancellationToken);
    }

    public Task<int> ContarTurnosCedulaDelDiaAsync(string cedula, DateTime fecha, CancellationToken cancellationToken = default)
    {
        var (inicio, fin) = RangoDelDia(fecha);

        return _dbContext.Turnos
            .Where(t => t.CedulaCliente == cedula && t.FechaHoraCreacion >= inicio && t.FechaHoraCreacion < fin)
            .CountAsync(cancellationToken);
    }

    public Task<int> ContarTurnosSucursalDelDiaAsync(int sucursalId, DateTime fecha, CancellationToken cancellationToken = default)
    {
        var (inicio, fin) = RangoDelDia(fecha);

        return _dbContext.Turnos
            .Where(t => t.SucursalId == sucursalId && t.FechaHoraCreacion >= inicio && t.FechaHoraCreacion < fin)
            .CountAsync(cancellationToken);
    }

    public async Task AgregarAsync(Turno turno, CancellationToken cancellationToken = default) =>
        await _dbContext.Turnos.AddAsync(turno, cancellationToken);

    public Task<int> ExpirarPendientesVencidosAsync(DateTime momento, CancellationToken cancellationToken = default) =>
        _dbContext.Turnos
            .Where(t => t.Estado == EstadoTurno.Pendiente && t.FechaHoraExpiracion <= momento)
            .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.Estado, EstadoTurno.Expirado), cancellationToken);

    private static (DateTime Inicio, DateTime Fin) RangoDelDia(DateTime fecha)
    {
        var inicio = fecha.Date;
        return (inicio, inicio.AddDays(1));
    }
}
