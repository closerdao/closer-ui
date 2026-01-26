import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import { priceFormat } from '../utils/helpers';
import Slider from './Slider';

interface Props {
  food: any;
}

const FoodListPreview = ({ food }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();

  const price = food.getIn(['price', 'val']);
  const currency = food.getIn(['price', 'cur']);

  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
        {food.get('photos') && food.get('photos').count() > 0 ? (
          <Slider
            reverse={true}
            isListingPreview={true}
            slides={food
              .get('photos')
              .toJS()
              .map((id: string) => ({
                image: `${cdn}${id}-post-md.jpg`,
              }))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
          {food.get('name')}
        </p>

        {food.get('description') && (
          <p
            className="text-xs text-gray-500 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: food.get('description').slice(0, 80),
            }}
          />
        )}

        <div className="mt-auto pt-2 flex items-center justify-between">
          {price > 0 ? (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">
                {priceFormat(price, currency)}
              </span>
              <span className="text-gray-400"> / {t('food_preview_day')}</span>
            </p>
          ) : price === 0 ? (
            <span className="text-xs font-semibold text-green-600">{t('listing_free')}</span>
          ) : (
            <span />
          )}

          {user?.roles?.includes('space-host') && (
            <Link
              href={`/food/${food.get('slug')}/edit`}
              className="text-xs text-gray-500 hover:text-accent"
            >
              {t('food_preview_edit')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodListPreview;
