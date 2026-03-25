using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Extensions
{
    public static class ControllerValidationExtensions
    {
        public static IActionResult? ValidatePositiveId(this ControllerBase controller, int value, string fieldName)
        {
            if (value > 0)
                return null;

            var errors = new Dictionary<string, string[]>
            {
                { fieldName, new[] { $"{fieldName} must be greater than 0." } }
            };

            return controller.BadRequest(new ValidationProblemDetails(errors)
            {
                Title = "Validation Failed",
                Detail = "One or more validation errors occurred."
            });
        }
    }
}
