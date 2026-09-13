using Amaris.Turnos.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Amaris.Turnos.Api.Common;

public static class ResultadoControllerExtensions
{
    public static ActionResult<TResponse> ToActionResult<TValue, TError, TResponse>(
        this ControllerBase controller,
        Result<TValue, TError> resultado,
        Func<TValue, ActionResult<TResponse>> exito,
        Func<TError, ActionResult> error)
        where TError : struct
    {
        return resultado.EsExitoso
            ? exito(resultado.Value!)
            : error(resultado.Error!.Value);
    }
}
