using FinanceControl.Domain.Entities;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Dtos.Response;
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
        Task<Result<IEnumerable<CategoryResponseDto>>> CreateCategoryAsync(CreateCategoryRequestDto requestDto, int userId);
        Task<IEnumerable<CategoryResponseDto>> GetAllCategoriesAsync(int userId);
        Task<Result<IEnumerable<CategoryResponseDto>>> UpdateCategoriesAsync(UpdateCategoriesRequestDto requestDto, int userId);
        Task<Result<IEnumerable<CategoryResponseDto>>> DeleteCategoryByIdAsync(int id, int userId);

    }
}
