using FinanceControl.Data.Data;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Brapi;
using FinanceControl.Services.Extensions;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.WebApi.Controllers.Base;
using FinanceControl.WebApi.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : BaseController
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ApplicationDbContext _context;
        private readonly AdminSettings _adminSettings;
        private readonly IValidator<UpdateUserPlanRequestDto> _updateUserPlanValidator;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            BrapiPriceUpdateJobService jobService,
            ApplicationDbContext context,
            IOptions<AdminSettings> adminSettings,
            IValidator<UpdateUserPlanRequestDto> updateUserPlanValidator,
            ILogger<AdminController> logger)
        {
            _jobService = jobService;
            _context = context;
            _adminSettings = adminSettings.Value;
            _updateUserPlanValidator = updateUserPlanValidator;
            _logger = logger;
        }

        /// <summary>
        /// Triggers the Brapi price update job immediately.
        /// Use this to manually populate historical price data without waiting for the scheduled run.
        /// </summary>
        [HttpPost("brapi-job/run")]
        public IActionResult RunBrapiJob(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Manual Brapi job trigger by user {UserId}.", GetUserId());

            // Fire-and-forget — the job can take several minutes on first run (backfill)
            _ = _jobService.RunAsync(cancellationToken);

            return Accepted(new
            {
                message = "Job iniciado em background. Acompanhe os logs da API para o progresso.",
                hint    = "Chame GET /api/admin/brapi-job/status para ver o resultado do último run.",
            });
        }

        /// <summary>
        /// Returns the status of the last Brapi job run.
        /// </summary>
        [HttpGet("brapi-job/status")]
        public IActionResult GetBrapiJobStatus()
        {
            return Ok(_jobService.LastStatus);
        }

        /// <summary>
        /// Switches an account between Free and Premium.
        /// </summary>
        /// <remarks>
        /// Provisional: this exists so the paid features can be exercised before the
        /// payment gateway is built, and it goes away when the gateway takes over the
        /// field. Gated by AdminSettings because the endpoint hands out a paid feature and
        /// there is no role system to lean on — an unconfigured list denies everyone.
        /// </remarks>
        [HttpPut("user/{id:int}/plan")]
        public async Task<IActionResult> UpdateUserPlanAsync(
            int id,
            [FromBody] UpdateUserPlanRequestDto requestDto)
        {
            if (this.ValidatePositiveId(id, "id") is { } idError)
                return idError;

            var validationResult = _updateUserPlanValidator.Validate(requestDto);
            if (validationResult.ToActionResult() is { } errorResult)
                return errorResult;

            var callerId = GetUserId();
            if (!_adminSettings.IsAdmin(callerId))
            {
                _logger.LogWarning("User {UserId} attempted to change the plan of user {TargetId}.", callerId, id);
                return Forbid();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user is null)
                return NotFound(new { error = "User not found." });

            user.Plan = requestDto.Plan;
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "User {UserId} set the plan of user {TargetId} to {Plan}.", callerId, id, requestDto.Plan);

            return Ok(new { id = user.Id, plan = user.Plan });
        }
    }
}
