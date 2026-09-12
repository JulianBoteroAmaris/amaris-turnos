using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Turnos;

public class CancelarTurnoResultado
{
    private CancelarTurnoResultado(bool esExitoso, Turno? turno, CancelarTurnoError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Turno = turno;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public Turno? Turno { get; }
    public CancelarTurnoError? Error { get; }
    public string? MensajeError { get; }

    public static CancelarTurnoResultado Exitoso(Turno turno) => new(true, turno, null, null);

    public static CancelarTurnoResultado Fallido(CancelarTurnoError error, string mensajeError) =>
        new(false, null, error, mensajeError);
}
