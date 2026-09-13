namespace Amaris.Turnos.Application.Turnos;

public class TurnoOptions
{
    public const string SeccionConfiguracion = "Turnos";

    public int LimiteTurnosDiariosPorCedula { get; set; } = 5;
    public int MinutosExpiracion { get; set; } = 15;
}
