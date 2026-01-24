using FinanceControl.Shared.Dtos.Respose;
using FinanceControl.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Domain.Interfaces.Service
{
    public interface IAreaCategoryService
    {
        Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> AddCategoryToAreaAsync(int areaId, int categoryId, int userId);
        Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> GetCategoriesByAreaAsync(int areaId, int userId);
        Task<Result<IEnumerable<GetAllCategoryByAreaResponseDto>>> RemoveCategoryFromAreaAsync(int areaId, int categoryId, int userId);
    }
}
