interface Props {
  embedId: string;
  isBackgroundVideo?: boolean;
}

const YoutubeEmbed = ({ embedId, isBackgroundVideo }: Props) => (
  <div className=" relative h-[100vh] w-[100vw] border-4 border-green-100 ">
    <iframe
      className="min-w-[100vw] min-h-[110vh] w-[calc(100vh+100vh)] h-[calc(100vh+20vw)] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] "
// className="absolute h-[200vh] w-[200vw] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
      // width="853"
      width={`${isBackgroundVideo ? '' : '853'}`}
      height={`${isBackgroundVideo ? '' : '480'}`}
      src={`${isBackgroundVideo ? `https://www.youtube.com/embed/${embedId}?playlist=${embedId}&showinfo=0&rel=0&autoplay=1&controls=0&mute=1&loop=1&modestbranding=1&showinfo=0&start=0&enablejsapi=1&&widgetid=3`:`https://www.youtube.com/embed/${embedId}`}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
);

export default YoutubeEmbed;