import { __ } from '../../utils/helpers';
import { Spinner } from '../ui';

interface Props {
  embedId: string;
  onLoad?: () => void;
  isVideoLoading: boolean;
}

const LearnVimeoEmbed = ({ embedId, onLoad, isVideoLoading }: Props) => {
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
        src={`https://player.vimeo.com/video/${embedId}?transparent=0&portrait=0&byline=0&title=0&badge=0&autoplay=1`}
        allowFullScreen={true}
      ></iframe>
    </>
  );
};

export default LearnVimeoEmbed;
