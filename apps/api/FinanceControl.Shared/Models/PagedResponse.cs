using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Models
{
    public class PagedResponse<TEntity> where TEntity : class
    {
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int PageSize { get; set; }
        public int RowCount { get; set; }
        public int TotalItems { get; set; }
        public IEnumerable<TEntity> Items { get; set; }
    }
}
