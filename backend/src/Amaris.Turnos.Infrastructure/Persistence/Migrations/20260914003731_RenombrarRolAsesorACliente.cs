using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Amaris.Turnos.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenombrarRolAsesorACliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "NombreUsuario", "PasswordHash", "Rol" },
                values: new object[] { "cliente", "AQAAAAIAAYagAAAAED/1ImO8UJldyO5W6tXlumtkSIlX8Mct7ngMbVcm4wFYy0LL3TnpfCA3iySIv0CVRw==", "Cliente" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "NombreUsuario", "PasswordHash", "Rol" },
                values: new object[] { "asesor", "AQAAAAIAAYagAAAAECZ2l4KsS9ctj9ZlkbxuCUuNxFjgjIsjRmGsQEHWtU9shTE4iTv/0+coeT8+TDe8ig==", "Asesor" });
        }
    }
}
