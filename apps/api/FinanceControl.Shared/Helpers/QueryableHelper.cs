using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace FinanceControl.Shared.Helpers
{
    public static class QueryableHelper
    {
        public static IQueryable<T> WhereIf<T>(
            this IQueryable<T> queryable,
            bool condition,
            Expression<Func<T, bool>> predicate)
        {
            if(condition)
            {
                return queryable.Where(predicate);
            }

            return queryable;
        }
    }
}
