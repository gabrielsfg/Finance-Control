using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/areas/{areaId:int}/categories")]
    [ApiController]
    [Authorize]
    public class AreaCategoryController : BaseController
    {
        private readonly IAreaCategoryService _service;

        public AreaCategoryController(IAreaCategoryService service)
        {
            _service = service;
        }

        [HttpPost("{categoryId:int}")]
        public async Task<IActionResult> AddCategoryToAreaAsync([FromRoute] int areaId, int categoryId)
        {
            var validationAreaId = this.ValidatePositiveId(areaId, "areaId");
            if (validationAreaId is not null)
                return validationAreaId;

            var validationCategoryId = this.ValidatePositiveId(categoryId, "categoryId");
            if (validationCategoryId is not null)
                return validationCategoryId;


            var userId = GetUserId();

            var result = await _service.AddCategoryToAreaAsync(areaId, categoryId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetCategoriesByAreaAsync([FromRoute] int areaId)
        {
            var validationAreaId = this.ValidatePositiveId(areaId, "areaId");
            if (validationAreaId is not null)
                return validationAreaId;

            var userId = GetUserId();

            var result = await _service.GetCategoriesByAreaAsync(areaId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }

        [HttpDelete("{categoryId:int}")]
        public async Task<IActionResult> RemoveCategoryFromAreaAsync([FromRoute] int areaId, int categoryId)
        {
            var validationAreaId = this.ValidatePositiveId(areaId, "areaId");
            if (validationAreaId is not null)
                return validationAreaId;

            var validationCategoryId = this.ValidatePositiveId(categoryId, "categoryId");
            if (validationCategoryId is not null)
                return validationCategoryId;

            var userId = GetUserId();

            var result = await _service.RemoveCategoryFromAreaAsync(areaId, categoryId, userId);
            if (result.IsFailure)
                return NotFound(new { error = result.Error });

            return Ok(result.Value);
        }
    }
}
