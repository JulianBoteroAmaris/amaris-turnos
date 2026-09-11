using Amaris.Turnos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Amaris.Turnos.Infrastructure.Persistence.Configurations;

public class SucursalConfiguration : IEntityTypeConfiguration<Sucursal>
{
    public void Configure(EntityTypeBuilder<Sucursal> builder)
    {
        builder.ToTable("Sucursales");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Nombre)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(s => s.Direccion)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(s => s.Ciudad)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Activa)
            .IsRequired();

        builder.HasData(
            new Sucursal { Id = 1, Nombre = "Sucursal Chapinero", Direccion = "Cra 13 #60-15", Ciudad = "Bogotá", Activa = true },
            new Sucursal { Id = 2, Nombre = "Sucursal Poblado", Direccion = "Cl 10 #35-20", Ciudad = "Medellín", Activa = true },
            new Sucursal { Id = 3, Nombre = "Sucursal Norte", Direccion = "Av 6N #23-45", Ciudad = "Cali", Activa = true },
            new Sucursal { Id = 4, Nombre = "Sucursal Centro", Direccion = "Cl 34 #43-15", Ciudad = "Bucaramanga", Activa = true }
        );
    }
}
