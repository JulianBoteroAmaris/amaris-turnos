using Amaris.Turnos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Amaris.Turnos.Infrastructure.Persistence.Configurations;

public class TurnoConfiguration : IEntityTypeConfiguration<Turno>
{
    public void Configure(EntityTypeBuilder<Turno> builder)
    {
        builder.ToTable("Turnos");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.NumeroTurno)
            .IsRequired();

        builder.Property(t => t.CedulaCliente)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.Estado)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.FechaHoraCreacion)
            .IsRequired();

        builder.Property(t => t.FechaHoraExpiracion)
            .IsRequired();

        builder.Property(t => t.RowVersion)
            .IsRowVersion();

        builder.HasOne(t => t.Sucursal)
            .WithMany(s => s.Turnos)
            .HasForeignKey(t => t.SucursalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.CedulaCliente, t.FechaHoraCreacion });
    }
}
