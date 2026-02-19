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
    public interface IAreaService
    {
        Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> CreateAreaAsync(CreateAreaRequestDto requestDto, int userId);
        Task<IEnumerable<GetAllAreaItemResponseDto>> GetAllAreasAsync(int budgetId, int userId);
        Task<GetAreaByIdResponseDto?> GetAreaByIdAync(int id, int userId);
        Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> UpdateAreaAsync(UpdateAreaRequestDto requestDto, int userId);
        Task<Result<IEnumerable<GetAllAreaItemResponseDto>>> DeleteAreaAsync(int id, int userId);
    }
}
