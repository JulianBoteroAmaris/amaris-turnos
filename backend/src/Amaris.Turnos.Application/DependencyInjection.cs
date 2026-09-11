using Amaris.Turnos.Application.Turnos;
using Microsoft.Extensions.DependencyInjection;

namespace Amaris.Turnos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITurnoService, TurnoService>();

        return services;
    }
}
