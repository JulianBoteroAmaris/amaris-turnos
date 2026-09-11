using Amaris.Turnos.Domain.Enums;

namespace Amaris.Turnos.Domain.Entities;

public class Turno
{
    public int Id { get; set; }
    public int NumeroTurno { get; set; }
    public string CedulaCliente { get; set; } = string.Empty;
    public int SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
    public DateTime FechaHoraCreacion { get; set; }
    public DateTime FechaHoraExpiracion { get; set; }
    public DateTime? FechaHoraActivacion { get; set; }
    public EstadoTurno Estado { get; set; }
}
