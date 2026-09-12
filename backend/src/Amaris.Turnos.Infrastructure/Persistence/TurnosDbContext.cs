using Amaris.Turnos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Amaris.Turnos.Infrastructure.Persistence;

public class TurnosDbContext : DbContext
{
    public TurnosDbContext(DbContextOptions<TurnosDbContext> options) : base(options)
    {
    }

    public DbSet<Turno> Turnos => Set<Turno>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TurnosDbContext).Assembly);
    }
}
