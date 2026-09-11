using System.Data;
using Amaris.Turnos.Application.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Amaris.Turnos.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private const int MaxIntentos = 3;

    private readonly TurnosDbContext _dbContext;

    public UnitOfWork(TurnosDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default) =>
        _dbContext.SaveChangesAsync(cancellationToken);

    public async Task<T> EjecutarTransaccionSerializableAsync<T>(
        Func<CancellationToken, Task<T>> operacion,
        CancellationToken cancellationToken = default)
    {
        for (var intento = 1; intento <= MaxIntentos; intento++)
        {
            await using var transaction = await _dbContext.Database
                .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            try
            {
                var resultado = await operacion(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return resultado;
            }
            catch (Exception ex) when (EsDeadlock(ex) && intento < MaxIntentos)
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
