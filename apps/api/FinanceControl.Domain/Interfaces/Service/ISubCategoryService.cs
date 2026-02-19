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
    public interface ISubCategoryService
    {
        Task<Result<IEnumerable<GetSubCategoryResponseDto>>> CreateSubCategoryAsync(CreateSubCategoryRequestDto requestDto, int userId);
        Task<IEnumerable<GetSubCategoryResponseDto>> GetAllSubCategoryAsync(int userId);
        Task<GetSubCategoryResponseDto> GetSubCategoryByIdAsync(int id, int userId);
        Task<Result<IEnumerable<GetSubCategoryResponseDto>>> UpdateSubCategoryAsync(UpdateSubCategoryRequestDto requestDto, int userId);
        Task<Result<IEnumerable<GetSubCategoryResponseDto>>> DeleteSubCategoryAsync(int Id, int userId);
    }
}
