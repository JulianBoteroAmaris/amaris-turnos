using Amaris.Turnos.Api.Sucursales;
using Amaris.Turnos.Application.Sucursales;
using Microsoft.AspNetCore.Mvc;

namespace Amaris.Turnos.Api.Controllers;

[ApiController]
[Route("api/sucursales")]
public class SucursalesController : ControllerBase
{
    private readonly ISucursalService _sucursalService;

    public SucursalesController(ISucursalService sucursalService)
    {
        _sucursalService = sucursalService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SucursalResponse>>> Obtener(CancellationToken cancellationToken)
    {
        var sucursales = await _sucursalService.ObtenerTodasAsync(cancellationToken);
        return Ok(sucursales.Select(SucursalResponse.DesdeEntidad).ToList());
    }
}
