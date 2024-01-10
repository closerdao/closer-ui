import { __ } from '../../utils/helpers';
import { Spinner } from '../ui';

interface Props {
  embedId: string;
  onLoad?: () => void;
  isVideoLoading: boolean;
}

const LearnYoutubeEmbed = ({ embedId, onLoad, isVideoLoading }: Props) => {
  return (
    <>
      {isVideoLoading ? (
        <div className="gap-2 absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="bg-accent-light flex gap-2 items-center py-2 px-4 rounded-md">
            <Spinner />
            {__('learn_loading_video')}
          </div>
        </div>
      ) : (
        ''
      )}
      <iframe
        onLoad={onLoad}
        className="w-full h-full"
        src={`${`https://www.youtube.com/embed/${embedId}?rel=0&showinfo=0&rel=0&autoplay=1&controls=1&modestbranding=1&showinfo=0&start=0&enablejsapi=1&&widgetid=3`}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </>
  );
};

export default LearnYoutubeEmbed;
