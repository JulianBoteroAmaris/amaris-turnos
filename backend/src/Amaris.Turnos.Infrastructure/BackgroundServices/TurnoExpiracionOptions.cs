namespace Amaris.Turnos.Infrastructure.BackgroundServices;

public class TurnoExpiracionOptions
{
    public const string SeccionConfiguracion = "TurnoExpiracion";

    public int IntervaloSegundos { get; set; } = 30;
}
