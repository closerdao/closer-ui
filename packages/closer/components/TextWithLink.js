const TextWithLink = ({ text, word, link }) => {
  const wordIndex = text.indexOf(word);
  const firstPart = text.slice(0, wordIndex);
  const secondPart = text.slice(wordIndex + word.length, text.length);

  return (
    <>
      {firstPart}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent"
      >
        {word}
      </a>
      {secondPart}
    </>
  );
};

export default TextWithLink;
