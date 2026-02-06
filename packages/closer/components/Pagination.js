import Link from 'next/link';

const Pagination = ({
  loadPage,
  queryParam = 'page',
  total,
  page = 1,
  limit = 50,
  maxPages = 5,
  isInverted = false,
}) => {
  const totalPages = Math.ceil(total / limit);
  const pageOffset =
    totalPages > maxPages ? Math.max(Math.floor(page - maxPages / 2), 0) : 0;

  if (totalPages === 1) {
    return null;
  }

  return (
    <div className="w-full flex justify-center ">
      <div className=" flex flex-row items-center justify-between gap-1">
        <div className="flex flex-row items-center">
          {page > 1 && (
            <Link
              href={{ query: { [queryParam]: page - 1 } }}
              className={`${isInverted ? 'text-white' : 'text-black'} `}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loadPage(page - 1);
              }}
            >
              <div className="bg-accent w-8 h-8 flex items-center justify-center rounded-full pr-0.5">
                <svg
                  width="8"
                  height="15"
                  viewBox="0 0 8 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.292893 14.6862C-0.0976311 14.2678 -0.0976312 13.5894 0.292893 13.171L5.58579 7.5L0.292893 1.82904C-0.0976317 1.41062 -0.0976317 0.732233 0.292893 0.313815C0.683417 -0.104605 1.31658 -0.104605 1.70711 0.313815L7.70711 6.74239C8.09763 7.1608 8.09763 7.8392 7.70711 8.25761L1.70711 14.6862C1.31658 15.1046 0.683418 15.1046 0.292893 14.6862Z"
                    fill="white"
                    transform="scale(-1, 1) translate(-8, 0)"
                  />
                </svg>
              </div>
            </Link>
          )}
        </div>
        <div className="flex flex-row items-center gap-1">
          {total > 0 &&
            limit &&
            Array.from(
              '.'.repeat(Math.min(totalPages, maxPages)).split(''),
            ).map((v, i) => {
              const toPage = i + pageOffset + 1;
              if (toPage > totalPages) {
                return;
              }
              return (
                <Link
                  href={{ query: { [queryParam]: toPage } }}
                  key={`page-${toPage}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                    page === toPage
                      ? 'bg-accent-light text-accent cursor-default'
                      : 'bg-gray-100'
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
            })}
        </div>
        <div className="flex flex-row items-center justify-between">
          {page < totalPages && (
            <Link
              href={{ query: { [queryParam]: page + 1 } }}
              className={`${isInverted ? 'text-white' : 'text-black'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loadPage(page + 1);
              }}
            >
              <div className="bg-accent w-8 h-8 flex items-center justify-center rounded-full pl-0.5">
                <svg
                  width="8"
                  height="15"
                  viewBox="0 0 8 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.292893 14.6862C-0.0976311 14.2678 -0.0976312 13.5894 0.292893 13.171L5.58579 7.5L0.292893 1.82904C-0.0976317 1.41062 -0.0976317 0.732233 0.292893 0.313815C0.683417 -0.104605 1.31658 -0.104605 1.70711 0.313815L7.70711 6.74239C8.09763 7.1608 8.09763 7.8392 7.70711 8.25761L1.70711 14.6862C1.31658 15.1046 0.683418 15.1046 0.292893 14.6862Z"
                    fill="white"
                  />
                </svg>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};


export default Pagination;
