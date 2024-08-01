import Link from 'next/link';

const Pagination = ({
  loadPage,
  queryParam,
  total,
  page,
  limit,
  maxPages,
  isInverted = false,
}) => {
  const totalPages = Math.ceil(total / limit);
  const pageOffset =
    totalPages > maxPages ? Math.max(Math.floor(page - maxPages / 2), 0) : 0;

  if (totalPages === 1) {
    return null;
  }

  return (
    <div className="pagination flex flex-row items-center justify-between">
      <div className="flex flex-row items-center justify-between">
        {page > 1 && (
          <Link
            href={{ query: { [queryParam]: page - 1 } }}
            className={`${isInverted ? 'text-white' : 'text-black'} p-1 px-3`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              loadPage(page - 1);
            }}
          >
            prev
          </Link>
        )}
      </div>
      <div className="flex flex-row items-center justify-between">
        {total > 0 &&
          limit &&
          Array.from('.'.repeat(Math.min(totalPages, maxPages)).split('')).map(
            (v, i) => {
              const toPage = i + pageOffset + 1;
              if (toPage > totalPages) {
                return;
              }
              return (
                <Link
                  href={{ query: { [queryParam]: toPage } }}
                  key={`page-${toPage}`}
                  className={`p-1 px-2 rounded-md mr-2 ${
                    page === toPage ? 'bg-accent text-white' : 'bg-gray-100'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    loadPage(toPage);
                  }}
                >
                  {`${toPage}`}
                </Link>
              );
            },
          )}
      </div>
      <div className="flex flex-row items-center justify-between">
        {page < totalPages && (
          <Link
            href={{ query: { [queryParam]: page + 1 } }}
            className={`${isInverted ? 'text-white' : 'text-black'} p-1`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              loadPage(page + 1);
            }}
          >
            next
          </Link>
        )}
      </div>
    </div>
  );
};

Pagination.defaultProps = {
  queryParam: 'page',
  page: 1,
  limit: 50,
  maxPages: 5,
  isInverted: false,
};

export default Pagination;
