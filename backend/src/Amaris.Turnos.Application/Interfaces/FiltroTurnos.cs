using Amaris.Turnos.Domain.Enums;

namespace Amaris.Turnos.Application.Interfaces;

public class FiltroTurnos
{
    public int? SucursalId { get; set; }
    public EstadoTurno? Estado { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Cedula { get; set; }
}
