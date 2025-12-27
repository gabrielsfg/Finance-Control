using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IUserService
    {
        Task<User?> RegisterUserAsync(CreateUserRequestDto requestDto);
    }
}
