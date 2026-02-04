interface Props {
  embedId: string;
  onLoad?: () => void;
}

const GenericYoutubeEmbed = ({ embedId, onLoad }: Props) => {
  return (
    <>
      <iframe
        onLoad={onLoad}
        className="w-full h-full rounded-lg"
        src={`${`https://www.youtube.com/embed/${embedId}?rel=0&showinfo=0&rel=0&autoplay=0&controls=1&modestbranding=1&showinfo=0&start=0&enablejsapi=1&&widgetid=3`}`}
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        allowFullScreen
      />
    </>
  );
};

export default GenericYoutubeEmbed;
