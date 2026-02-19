using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IAccountService
    {
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> CreateAccountAsync(CreateAccountRequestDto requestDto, int userId);
        Task<IEnumerable<GetAccountItemResponseDto>> GetAllAccountAsync(int userId);
        Task<GetAccountByIdResponseDto> GetAccountByIdAsync(int id, int userId);
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> UpdateAccountAsync(UpdateAccountRequestDto requestDto, int userId);
        Task<Result<IEnumerable<GetAccountItemResponseDto>>> DeleteAccountByIdAsync(int id, int userId);
    }
}
