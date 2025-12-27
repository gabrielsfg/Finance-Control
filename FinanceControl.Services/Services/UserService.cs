using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Service;
using FinanceControl.Shared.Dtos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Services.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public UserService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User?> RegisterUserAsync(CreateUserRequestDto requestDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == requestDto.Email))
                return null;

            var user = new User();
            var hasedPassword = new PasswordHasher<User>().HashPassword(user, requestDto.Password);

            user.Email = requestDto.Email;
            user.Name = requestDto.Name;

            _context.Add(user);
            await _context.SaveChangesAsync();

            return user;
        }
    }
}
