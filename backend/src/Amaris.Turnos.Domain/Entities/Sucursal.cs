namespace Amaris.Turnos.Domain.Entities;

public class Sucursal
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public bool Activa { get; set; }

    public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
}
