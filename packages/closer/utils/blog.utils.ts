export const getCleanString = (htmlString: string | undefined): string => {
  if (!htmlString) {
    return '';
  }
  return htmlString.replace(/<[^>]*>/g, '');
};

export const getFirstSentence = (htmlString: string | undefined): string => {
  if (!htmlString) {
    return '';
  }
  const cleanString = getCleanString(htmlString);
  const firstSentence = cleanString.match(/[^.!?]+[.!?]/);
  return firstSentence ? firstSentence[0].trim() : '';
};

export const estimateReadingTime = (htmlContent: string | undefined): number => {
    if (!htmlContent) {
        return 0;
        }
    const cleanString = getCleanString(htmlContent)
    const wordCount = cleanString.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
  
    return readingTimeMinutes;
  }
