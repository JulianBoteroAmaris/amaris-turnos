using System.Security.Claims;
using System.Text;
using Amaris.Turnos.Api.Configuration;
using Amaris.Turnos.Api.Middleware;
using Amaris.Turnos.Application;
using Amaris.Turnos.Infrastructure;
using Amaris.Turnos.Infrastructure.Auth;
using Amaris.Turnos.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

const string FrontendCorsPolicy = "FrontendCorsPolicy";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHostedService<TurnoExpiracionBackgroundService>();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SeccionConfiguracion).Get<JwtOptions>()
    ?? throw new InvalidOperationException("La configuración de JWT (sección 'Jwt') no fue encontrada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

var corsOptions = builder.Configuration.GetSection(FrontendCorsOptions.SeccionConfiguracion).Get<FrontendCorsOptions>()
    ?? throw new InvalidOperationException("La configuración de CORS (sección 'Cors') no fue encontrada.");

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(corsOptions.Origen)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
