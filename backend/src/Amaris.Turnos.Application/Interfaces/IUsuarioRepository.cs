using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario, CancellationToken cancellationToken = default);
}
