using Amaris.Turnos.Application.Auth;
using Amaris.Turnos.Application.Interfaces;
using Amaris.Turnos.Infrastructure.Auth;
using Amaris.Turnos.Infrastructure.Persistence;
using Amaris.Turnos.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Amaris.Turnos.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("TurnosDb");

        services.AddDbContext<TurnosDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<ITurnoRepository, TurnoRepository>();
        services.AddScoped<ISucursalRepository, SucursalRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SeccionConfiguracion));

        return services;
    }
}
