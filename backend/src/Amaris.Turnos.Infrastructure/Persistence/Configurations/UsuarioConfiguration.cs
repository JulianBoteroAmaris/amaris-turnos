using Amaris.Turnos.Domain.Entities;
using Amaris.Turnos.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Amaris.Turnos.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.NombreUsuario)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Rol)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(u => u.NombreUsuario)
            .IsUnique();

        builder.HasData(
            new Usuario
            {
                Id = 1,
                NombreUsuario = "admin",
                PasswordHash = "AQAAAAIAAYagAAAAEJoP1M+VNn2T9GGi8fB1d/a2wsszc1q1Y258kc4CEpU8K3Y9GOuH9zABt00uTAH6uw==",
                Rol = RolUsuario.Administrador
            },
            new Usuario
            {
                Id = 2,
                NombreUsuario = "cliente",
                PasswordHash = "AQAAAAIAAYagAAAAED/1ImO8UJldyO5W6tXlumtkSIlX8Mct7ngMbVcm4wFYy0LL3TnpfCA3iySIv0CVRw==",
                Rol = RolUsuario.Cliente
            }
        );
    }
}
