import { useEffect, useRef, useState } from 'react';

interface Props {
  embedId: string;
  isBackgroundVideo?: boolean;
  placeholderImageUrl?: string;
}

const YoutubeEmbed = ({
  embedId,
  isBackgroundVideo = false,
  placeholderImageUrl = `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`,
}: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the component after initial render to avoid blocking
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const idleCallback =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    idleCallback(() => {
      setIsLoaded(true);
    });
  }, []);

  // Use Intersection Observer to detect when the component is about to enter viewport
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Automatically load the player when visible for background videos
          if (isBackgroundVideo) {
            loadYouTubePlayer();
          }
          observer.disconnect();
        }
      });
    }, options);

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isLoaded, isBackgroundVideo]);

  // Load the YouTube player only when visible and user interacts
  const loadYouTubePlayer = () => {
    if (isPlayerLoaded) return;

    // Create a lightweight iframe that doesn't load YouTube scripts immediately
    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'src',
      `https://www.youtube.com/embed/${embedId}?playlist=${embedId}&showinfo=0&rel=0&autoplay=1&controls=0&mute=1&loop=1&modestbranding=1&showinfo=0&start=0&enablejsapi=1&&widgetid=3&loading=lazy`,
    );
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    );
    iframe.setAttribute('allowFullScreen', 'true');
    iframe.setAttribute('loading', 'lazy');
    iframe.className = isBackgroundVideo
      ? 'min-w-[100vw] min-h-[110vh] w-[calc(100vh+100vh)] h-[calc(100vh+20vw)] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]'
      : 'w-full h-full';

    // Replace the placeholder with the iframe
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(iframe);
      setIsPlayerLoaded(true);
    }
  };

  // If not loaded yet, show nothing to avoid layout shifts
  if (!isLoaded) {
    return <div className="h-full" />;
  }

  // If not visible yet or player not loaded, show the placeholder image
  if (!isVisible || !isPlayerLoaded) {
    return (
      <div
        ref={containerRef}
        className={`h-full ${
          isBackgroundVideo
            ? 'min-w-[100vw] min-h-[110vh] w-[calc(100vh+100vh)] h-[calc(100vh+20vw)] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]'
            : 'w-full h-full'
        }`}
        style={{
          backgroundImage: `url(${placeholderImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: isBackgroundVideo ? 'default' : 'pointer',
        }}
        onClick={isBackgroundVideo ? undefined : loadYouTubePlayer}
      />
    );
  }

  // If visible and player loaded, the iframe will be inserted by the loadYouTubePlayer function
  return <div ref={containerRef} className="h-full" />;
};

export default YoutubeEmbed;
