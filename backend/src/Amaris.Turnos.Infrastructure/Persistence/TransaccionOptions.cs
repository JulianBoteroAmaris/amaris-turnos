namespace Amaris.Turnos.Infrastructure.Persistence;

public class TransaccionOptions
{
    public const string SeccionConfiguracion = "Transacciones";

    public int MaxIntentos { get; set; } = 3;
}
