namespace Amaris.Turnos.Application.Interfaces;

public interface IUnitOfWork
{
    Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default);

    Task<bool> IntentarGuardarCambiosAsync(CancellationToken cancellationToken = default);

    Task<T> EjecutarTransaccionSerializableAsync<T>(
        Func<CancellationToken, Task<T>> operacion,
        CancellationToken cancellationToken = default);
}
