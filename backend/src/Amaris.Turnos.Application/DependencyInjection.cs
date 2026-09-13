using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Application.Sucursales;
using Amaris.Turnos.Application.Turnos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Amaris.Turnos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<ITurnoService, TurnoService>();
        services.AddScoped<ISucursalService, SucursalService>();
        services.AddScoped<IAuthService, AuthService>();

        services.Configure<TurnoOptions>(configuration.GetSection(TurnoOptions.SeccionConfiguracion));

        return services;
    }
}
