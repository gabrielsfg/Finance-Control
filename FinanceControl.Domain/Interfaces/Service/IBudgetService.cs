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
    public interface IBudgetService
    {
        Task<Result<int>> CreateBudgetAsync(CreateBudgetResquestDto requestDto, int userId);
        Task<List<GetAllBudgetResponseDto>> GetAllBudgetAsync(int userId);
        Task<GetBudgetByIdResponseDto> GetBudgetByIdAsync(int id, int userId);
        Task<Result<GetBudgetByIdResponseDto>> UpdateBudgetAsync(UpdateBudgetRequestDto requestDto, int userId);
        Task<Result<List<GetAllBudgetResponseDto>>> DeleteBudgetAsync(int id, int userId);
    }
}
