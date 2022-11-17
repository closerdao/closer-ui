import React from 'react';
import Linkify from 'react-linkify';

const EventDescription = ({
  event
}) => {
  return <section className="mb-6">
    <h3 className="font-bold text-2xl">Event description</h3>
    <p className="whitespace-pre-line">
      <Linkify componentDecorator={(decoratedHref, decoratedText, key) => <a target="_blank" rel="nofollow noreferrer" href={decoratedHref} key={key} onClick={e => e.stopPropagation()}>
        {decoratedText}
      </a>}>
        {event.description}
      </Linkify>
    </p>
  </section>;
};

export default EventDescription;
  