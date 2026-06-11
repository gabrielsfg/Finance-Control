using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Dtos.Request
{
    public class UpdateSubCategoryRequestDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Emoji { get; set; }
        public int CategoryId { get; set; }
    }
}
