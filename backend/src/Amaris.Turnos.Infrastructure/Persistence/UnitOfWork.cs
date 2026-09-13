using System.Data;
using Amaris.Turnos.Application.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Amaris.Turnos.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly TurnosDbContext _dbContext;
    private readonly int _maxIntentos;

    public UnitOfWork(TurnosDbContext dbContext, IOptions<TransaccionOptions> opciones)
    {
        _dbContext = dbContext;
        _maxIntentos = opciones.Value.MaxIntentos;
    }

    public Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);

    public async Task<bool> IntentarGuardarCambiosAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }
    }

    public async Task<T> EjecutarTransaccionSerializableAsync<T>(
        Func<CancellationToken, Task<T>> operacion,
        CancellationToken cancellationToken = default)
    {
        for (var intento = 1; intento <= _maxIntentos; intento++)
        {
            await using var transaction = await _dbContext.Database
                .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            try
            {
                var resultado = await operacion(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return resultado;
            }
            catch (Exception ex) when (EsDeadlock(ex) && intento < _maxIntentos)
            {
                await transaction.RollbackAsync(cancellationToken);
                _dbContext.ChangeTracker.Clear();
                await Task.Delay(TimeSpan.FromMilliseconds(100 * intento), cancellationToken);
            }
        }

        throw new InvalidOperationException(
            "No se pudo completar la operación por conflictos de concurrencia. Intenta nuevamente.");
    }

    private static bool EsDeadlock(Exception ex)
    {
        if (ex is SqlException sqlException)
        {
            return sqlException.Number == 1205;
        }

        return ex.InnerException is SqlException innerSqlException && innerSqlException.Number == 1205;
    }
}
