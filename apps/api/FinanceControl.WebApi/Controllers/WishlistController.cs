using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.WebApi.Controllers.Base;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/wishlist")]
    [ApiController]
    [Authorize]
    public class WishlistController : BaseController
    {
        private readonly IWishlistService _wishlistService;
        private readonly IValidator<CreateWishlistItemRequestDto> _createValidator;
        private readonly IValidator<UpdateWishlistItemRequestDto> _updateValidator;
        private readonly IValidator<RecordWishlistPriceRequestDto> _priceValidator;

        public WishlistController(
            IWishlistService wishlistService,
            IValidator<CreateWishlistItemRequestDto> createValidator,
            IValidator<UpdateWishlistItemRequestDto> updateValidator,
            IValidator<RecordWishlistPriceRequestDto> priceValidator)
        {
            _wishlistService = wishlistService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _priceValidator = priceValidator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateWishlistItemRequestDto dto)
        {
            var validation = _createValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _wishlistService.CreateAsync(GetUserId(), dto);
            return Created($"/api/wishlist/{result.Id}", result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAsync([FromQuery] EnumWishlistStatus? status)
        {
            var items = await _wishlistService.GetAllAsync(GetUserId(), status);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetByIdAsync([FromRoute] int id)
        {
            var item = await _wishlistService.GetByIdAsync(GetUserId(), id);
            if (item is null) return NotFound();
            return Ok(item);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> UpdateAsync([FromRoute] int id, [FromBody] UpdateWishlistItemRequestDto dto)
        {
            var validation = _updateValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _wishlistService.UpdateAsync(GetUserId(), id, dto);
            if (result.IsFailure) return NotFound();
            return Ok(result.Value);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync([FromRoute] int id)
        {
            var result = await _wishlistService.DeleteAsync(GetUserId(), id);
            if (result.IsFailure) return NotFound();
            return NoContent();
        }

        [HttpPost("{id:int}/price")]
        public async Task<IActionResult> RecordPriceAsync([FromRoute] int id, [FromBody] RecordWishlistPriceRequestDto dto)
        {
            var validation = _priceValidator.Validate(dto);
            if (validation.ToActionResult() is { } err) return err;

            var result = await _wishlistService.RecordPriceAsync(GetUserId(), id, dto.Price);
            if (result.IsFailure) return NotFound();
            return Created($"/api/wishlist/{id}/price-history", result.Value);
        }

        [HttpPost("{id:int}/purchase")]
        public async Task<IActionResult> PurchaseAsync([FromRoute] int id)
        {
            var result = await _wishlistService.PurchaseAsync(GetUserId(), id);

            if (result.IsFailure)
            {
                if (result.Error == "conflict")
                    return Conflict(new { message = "Item is not in Pending status." });
                return NotFound();
            }

            return Ok(result.Value);
        }

        [HttpGet("{id:int}/price-history")]
        public async Task<IActionResult> GetPriceHistoryAsync([FromRoute] int id)
        {
            var result = await _wishlistService.GetPriceHistoryAsync(GetUserId(), id);
            if (result.IsFailure) return NotFound();
            return Ok(result.Value);
        }
    }
}
