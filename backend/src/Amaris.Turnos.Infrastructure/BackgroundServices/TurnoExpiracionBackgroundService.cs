using Amaris.Turnos.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Amaris.Turnos.Infrastructure.BackgroundServices;

public class TurnoExpiracionBackgroundService : BackgroundService
{
    private static readonly TimeSpan Intervalo = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TurnoExpiracionBackgroundService> _logger;

    public TurnoExpiracionBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<TurnoExpiracionBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var turnoRepository = scope.ServiceProvider.GetRequiredService<ITurnoRepository>();

                var cantidadExpirados = await turnoRepository.ExpirarPendientesVencidosAsync(DateTime.UtcNow, stoppingToken);

                if (cantidadExpirados > 0)
                {
                    _logger.LogInformation("Se expiraron {Cantidad} turnos pendientes.", cantidadExpirados);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error al expirar turnos pendientes vencidos.");
            }

            try
            {
                await Task.Delay(Intervalo, stoppingToken);
            }
            catch (OperationCanceledException)
            {
            }
        }
    }
}
