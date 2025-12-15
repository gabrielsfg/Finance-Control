using FinanceControl.Shared.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TransactionController : Controller
    {
        private readonly ILogger<TransactionController> _logger;

        public TransactionController(ILogger<TransactionController> logger)
        {
            _logger = logger;
        }
        [HttpPost("create")]
        public async Task<IActionResult> CreateTransactionAsync([FromBody] CreateTransactionRequestDto requestDto)
        {
            return Ok();
        }
    }
}
