using FinanceControl.Services.Brapi;
using FinanceControl.WebApi.Controllers.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : BaseController
    {
        private readonly BrapiPriceUpdateJobService _jobService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(BrapiPriceUpdateJobService jobService, ILogger<AdminController> logger)
        {
            _jobService = jobService;
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
    }
}
