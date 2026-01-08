using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Extensions
{
    public static class ValidationExtensions
    {
        public static IActionResult? ToActionResult(this ValidationResult result)
        {
            if (result.IsValid)
                return null;

            return new BadRequestObjectResult(new ValidationProblemDetails(result.ToDictionary())
            {
                Title = "Validation Failed",
                Detail = "One or more validation errors occurred."
            });
        }
    }
}
