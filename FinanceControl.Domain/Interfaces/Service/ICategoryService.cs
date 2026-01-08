using FinanceControl.Domain.Entities;
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
    public interface ICategoryService
    {
        Task<Result<CategoryResponseDto>> CreateCategoryAsync(CreateCategoryRequestDto requestDto, int userId);
        Task<GetCategoriesResponseDto> GetCategoriesAsync(int userId);
        Task<Result<GetCategoriesResponseDto>> PatchCategoryByIdAsync(PatchCategoryRequestDto requestDto, int userId);
        Task<Result<GetCategoriesResponseDto>> DeleteCategoryByIdAsync(int id, int userId);

    }
}
