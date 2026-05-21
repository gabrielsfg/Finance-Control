using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ImportController : Base.BaseController
{
    private readonly IImportService _importService;

    public ImportController(IImportService importService)
    {
        _importService = importService;
    }

    [HttpPost("parse")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> ParseFileAsync([FromForm] int accountId, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var userId = GetUserId();
        using var stream = file.OpenReadStream();
        var result = await _importService.ParseFileAsync(stream, file.FileName, accountId, userId);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmImportAsync([FromBody] ImportTransactionsRequestDto requestDto)
    {
        var userId = GetUserId();
        var result = await _importService.ConfirmImportAsync(requestDto, userId);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { importedCount = result.Value });
    }
}
