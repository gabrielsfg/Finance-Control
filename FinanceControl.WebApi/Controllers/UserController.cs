using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FinanceControl.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUserAsync(CreateUserRequestDto requestDto)
        {
            await _userService.RegisterUserAsync(requestDto);
            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> UserLoginAsync()
    }
}
