using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Api.Turnos;

public record TurnoResponse(
    int Id,
    int NumeroTurno,
    string CedulaCliente,
    int SucursalId,
    string? SucursalNombre,
    string Estado,
    DateTime FechaHoraCreacion,
    DateTime FechaHoraExpiracion,
    DateTime? FechaHoraActivacion)
{
    public static TurnoResponse DesdeEntidad(Turno turno) => new(
        turno.Id,
        turno.NumeroTurno,
        turno.CedulaCliente,
        turno.SucursalId,
        turno.Sucursal?.Nombre,
        turno.Estado.ToString(),
        turno.FechaHoraCreacion,
        turno.FechaHoraExpiracion,
        turno.FechaHoraActivacion);
}
