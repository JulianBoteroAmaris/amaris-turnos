namespace Amaris.Turnos.Application.Common;

public class Result<TValue, TError>
    where TError : struct
{
    private Result(bool esExitoso, TValue? value, TError? error, string? mensajeError)
    {
        EsExitoso = esExitoso;
        Value = value;
        Error = error;
        MensajeError = mensajeError;
    }

    public bool EsExitoso { get; }
    public TValue? Value { get; }
    public TError? Error { get; }
    public string? MensajeError { get; }

    public static Result<TValue, TError> Exitoso(TValue value) => new(true, value, null, null);

    public static Result<TValue, TError> Fallido(TError error, string mensajeError) =>
        new(false, default, error, mensajeError);
}
