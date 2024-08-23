import { useEffect } from 'react';

import { usePlatform } from '../../contexts/platform';
import { cdn } from '../../utils/api';
import { Heading } from '../ui';
import Slider from './../Slider';

interface Props {
  foodOption: string;
}

const FoodPhotoGallery = ({ foodOption }: Props) => {
  const { platform }: any = usePlatform();

  const foodFilter = {
    where: {},
  };
  const foodOptions = platform.food.find(foodFilter);


  const selectedFoodOption = foodOptions?.find((food: any) => {
    return food.get('slug').includes(foodOption);
  });


  const loadData = async () => {
    await Promise.all([platform.food.get(foodFilter)]);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className='w-full'>
      {selectedFoodOption && (
        <div
          key={selectedFoodOption.get('slug')}
          className="flex flex-col gap-4"
        >
          <Heading level={3}>{selectedFoodOption.get('name')}</Heading>
          {selectedFoodOption.get('photos') &&
            selectedFoodOption.get('photos').count() > 0 && (
              <Slider
                className=" rounded-md flex w-full bg-green-200"
                reverse={true}
                isListingPreview={true}
                slides={selectedFoodOption
                  .get('photos')
                  .toJS()
                  .map((id: string) => ({
                    image: `${cdn}${id}-post-md.jpg`,
                  }))}
              />
            )}
          <div className='font-normal'
            dangerouslySetInnerHTML={{
              __html: selectedFoodOption.get('description'),
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FoodPhotoGallery;
