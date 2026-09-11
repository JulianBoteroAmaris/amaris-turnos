using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Amaris.Turnos.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Sucursales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Ciudad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sucursales", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Turnos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroTurno = table.Column<int>(type: "int", nullable: false),
                    CedulaCliente = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SucursalId = table.Column<int>(type: "int", nullable: false),
                    FechaHoraCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaHoraExpiracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaHoraActivacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Turnos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Turnos_Sucursales_SucursalId",
                        column: x => x.SucursalId,
                        principalTable: "Sucursales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Sucursales",
                columns: new[] { "Id", "Activa", "Ciudad", "Direccion", "Nombre" },
                values: new object[,]
                {
                    { 1, true, "Bogotá", "Cra 13 #60-15", "Sucursal Chapinero" },
                    { 2, true, "Medellín", "Cl 10 #35-20", "Sucursal Poblado" },
                    { 3, true, "Cali", "Av 6N #23-45", "Sucursal Norte" },
                    { 4, true, "Bucaramanga", "Cl 34 #43-15", "Sucursal Centro" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_CedulaCliente_FechaHoraCreacion",
                table: "Turnos",
                columns: new[] { "CedulaCliente", "FechaHoraCreacion" });

            migrationBuilder.CreateIndex(
                name: "IX_Turnos_SucursalId",
                table: "Turnos",
                column: "SucursalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Turnos");

            migrationBuilder.DropTable(
                name: "Sucursales");
        }
    }
}
