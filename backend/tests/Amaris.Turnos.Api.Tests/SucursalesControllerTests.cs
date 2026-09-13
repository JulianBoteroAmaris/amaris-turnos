using Amaris.Turnos.Api.Controllers;
using Amaris.Turnos.Api.Sucursales;
using Amaris.Turnos.Application.Sucursales;
using Amaris.Turnos.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using Shouldly;

namespace Amaris.Turnos.Api.Tests;

public class SucursalesControllerTests
{
    private readonly ISucursalService _sucursalService = Substitute.For<ISucursalService>();

    private SucursalesController CrearController() => new(_sucursalService);

    [Fact]
    public async Task Obtener_Retorna200ConLasSucursalesDelServicio()
    {
        var sucursales = new List<Sucursal>
        {
            new() { Id = 1, Nombre = "Principal", Direccion = "Calle 1", Ciudad = "Bogota", Activa = true },
            new() { Id = 2, Nombre = "Norte", Direccion = "Calle 2", Ciudad = "Medellin", Activa = true }
        };
        _sucursalService.ObtenerTodasAsync(Arg.Any<CancellationToken>()).Returns(sucursales);

        var resultado = await CrearController().Obtener(CancellationToken.None);

        var ok = resultado.Result.ShouldBeOfType<OkObjectResult>();
        ok.StatusCode.ShouldBe(StatusCodes.Status200OK);
        var response = ok.Value.ShouldBeOfType<List<SucursalResponse>>();
        response.Count.ShouldBe(2);
        response[0].Id.ShouldBe(1);
        response[1].Nombre.ShouldBe("Norte");
    }
}
