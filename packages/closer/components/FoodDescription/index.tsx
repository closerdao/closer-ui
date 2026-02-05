import { FoodOption } from '../../types/food';
import { cdn } from '../../utils/api';
import Slider from '../Slider';
import { Heading } from '../ui';

interface Props {
  foodOption: FoodOption;
  hideHeading?: boolean;
}

const FoodDescription = ({ foodOption, hideHeading }: Props) => {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {!hideHeading && <Heading level={3}>{foodOption.name}</Heading>}
        {foodOption.photos.length > 0 && (
          <Slider
            className=" rounded-md flex w-full bg-green-200"
            reverse={true}
            isListingPreview={true}
            slides={foodOption.photos.map((id: string) => ({
              image: `${cdn}${id}-post-md.jpg`,
            }))}
          />
        )}
        <div
          className="font-normal"
          dangerouslySetInnerHTML={{
            __html: foodOption.description,
          }}
        />
      </div>
    </div>
  );
};

export default FoodDescription;
