using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Api.Sucursales;

public record SucursalResponse(int Id, string Nombre, string Direccion, string Ciudad, bool Activa)
{
    public static SucursalResponse DesdeEntidad(Sucursal sucursal) => new(
        sucursal.Id,
        sucursal.Nombre,
        sucursal.Direccion,
        sucursal.Ciudad,
        sucursal.Activa);
}
