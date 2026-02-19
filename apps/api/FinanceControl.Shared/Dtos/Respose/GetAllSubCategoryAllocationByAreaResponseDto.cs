using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Respose
{
    public class GetAllSubCategoryAllocationByAreaResponseDto
    {
        public int AreaId { get; set; }
        public string AreaName { get; set; }
        public List<CategoryAllocationItemByAreaIdDto> Categories { get; set; }
    }
}
