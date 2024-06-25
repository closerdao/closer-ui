import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { capitalizeFirstLetter } from '../../utils/learn.helpers';

interface Props {
  categories: string[];
  currentCategory: string;
}

const LearnCategoriesNav = ({ categories, currentCategory }: Props) => {
  const t = useTranslations();
  return (
    <ul className="flex flex-col gap-0.5">
      <li>
        <Link
          className={`block p-1 px-2 rounded-md hover:bg-accent-light ${
            currentCategory === t('learn_categories_all').toLowerCase()
              ? 'font-bold bg-accent-light'
              : 'bg-transparent'
          } `}
          href="/learn/category/all"
        >
          {t('learn_categories_all')}
        </Link>
      </li>
      {categories &&
        categories.map((navCategory: string) => {
          return (
            <li key={navCategory}>
              <Link
                className={`block p-1 px-2 rounded-md hover:bg-accent-light ${
                  currentCategory === navCategory
                    ? 'font-bold bg-accent-light'
                    : 'bg-transparent'
                } `}
                href={`/learn/category/${navCategory}`}
              >
                {capitalizeFirstLetter(navCategory)}
              </Link>
            </li>
          );
        })}
    </ul>
  );
};

export default LearnCategoriesNav;
