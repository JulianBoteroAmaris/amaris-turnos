using Amaris.Turnos.Domain.Entities;
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

        builder.HasIndex(u => u.NombreUsuario)
            .IsUnique();

        builder.HasData(
            new Usuario
            {
                Id = 1,
                NombreUsuario = "admin",
                PasswordHash = "AQAAAAIAAYagAAAAEJoP1M+VNn2T9GGi8fB1d/a2wsszc1q1Y258kc4CEpU8K3Y9GOuH9zABt00uTAH6uw=="
            },
            new Usuario
            {
                Id = 2,
                NombreUsuario = "asesor",
                PasswordHash = "AQAAAAIAAYagAAAAECZ2l4KsS9ctj9ZlkbxuCUuNxFjgjIsjRmGsQEHWtU9shTE4iTv/0+coeT8+TDe8ig=="
            }
        );
    }
}
