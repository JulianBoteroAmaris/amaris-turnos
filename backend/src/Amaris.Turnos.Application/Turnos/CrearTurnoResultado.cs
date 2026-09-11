using Amaris.Turnos.Domain.Entities;

namespace Amaris.Turnos.Application.Turnos;

public class CrearTurnoResultado
{
    private CrearTurnoResultado(bool esExitoso, Turno? turno, CrearTurnoError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Turno = turno;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public Turno? Turno { get; }
    public CrearTurnoError? Error { get; }
    public string? MensajeError { get; }

    public static CrearTurnoResultado Exitoso(Turno turno) => new(true, turno, null, null);

    public static CrearTurnoResultado Fallido(CrearTurnoError error, string mensajeError) =>
        new(false, null, error, mensajeError);
}
