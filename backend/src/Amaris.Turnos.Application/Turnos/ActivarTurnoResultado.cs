using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Turnos;

public class ActivarTurnoResultado
{
    private ActivarTurnoResultado(bool esExitoso, Turno? turno, ActivarTurnoError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Turno = turno;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public Turno? Turno { get; }
    public ActivarTurnoError? Error { get; }
    public string? MensajeError { get; }

    public static ActivarTurnoResultado Exitoso(Turno turno) => new(true, turno, null, null);

    public static ActivarTurnoResultado Fallido(ActivarTurnoError error, string mensajeError) =>
        new(false, null, error, mensajeError);
}
