using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Application.Sucursales;
using Amaris.Turnos.Application.Turnos;
using Microsoft.Extensions.DependencyInjection;

namespace Amaris.Turnos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ITurnoService, TurnoService>();
        services.AddScoped<ISucursalService, SucursalService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
