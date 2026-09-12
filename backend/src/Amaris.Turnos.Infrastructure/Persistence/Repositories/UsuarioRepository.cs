using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Amaris.Turnos.Infrastructure.Persistence.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly TurnosDbContext _dbContext;

    public UsuarioRepository(TurnosDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario, CancellationToken cancellationToken = default) =>
        _dbContext.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.NombreUsuario == nombreUsuario, cancellationToken);
}
