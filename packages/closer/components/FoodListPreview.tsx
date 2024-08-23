import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import Slider from './Slider';

interface Props {
  food: any;
}

const FoodListPreview = ({ food }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-5 justify-between mb-8 shadow  bg-white rounded-xl p-4">
      <div className="flex flex-col gap-5">
        {food.get('photos') && food.get('photos').count() > 0 && (
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
        )}
        <p className=" uppercase font-bold block text-left">
          {food.get('name')}
        </p>
        {food.get('description') && (
          <p
            className="rich-text text-left"
            dangerouslySetInnerHTML={{
              __html: `${food.get('description').slice(0, 120)} ${
                food.get('description').length > 120 ? '...' : ''
              }`,
            }}
          />
        )}
      </div>
      {user?.roles?.includes('space-host') && (
        <div className="card-footer">
          {(user?.roles?.includes('admin') ||
            user?.roles?.includes('space-host')) && (
            <Link href={`/food/${food.get('slug')}/edit`} className="btn mr-2">
              {t('food_preview_edit')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodListPreview;
