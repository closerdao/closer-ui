import Link from 'next/link';

const MENU_ITEMS = [
  {
    label: 'Link 1',
    url: '/link1',
  },
  {
    label: 'Link 2',
    url: '/link2',
  },
  {
    label: 'Link 3',
    url: '/link3',
  },
];

const TokenSaleNavigation = () => {
  return (
    <div className="p-10 w-full">
      <div className="flex justify-between">
        <div>Logo</div>
        <div className="flex gap-4">
          {MENU_ITEMS.map(({ label, url }) => (
            <Link href={url} key={url} passHref>
              <a>{label}</a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TokenSaleNavigation;
