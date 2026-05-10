import React from 'react';

import InlineFormattedSegments from './inlineFormattedSegments';

function mapRichChildren(nodes: React.ReactNode): React.ReactNode {
  return React.Children.map(nodes, (child, index) => {
    if (typeof child === 'string' || typeof child === 'number') {
      const s = String(child);
      if (!s) {
        return child;
      }
      return (
        <InlineFormattedSegments key={`t-${index}-${s.slice(0, 12)}`} text={s} />
      );
    }

    if (!React.isValidElement(child)) {
      return child;
    }

    const props = child.props as Record<string, unknown>;
    const tag = typeof child.type === 'string' ? child.type : '';
    if (tag === 'code' || tag === 'pre') {
      return child;
    }

    if (props.children != null) {
      return React.cloneElement(child, {
        ...props,
        children: mapRichChildren(props.children as React.ReactNode),
      } as never);
    }

    return child;
  });
}

type RichMarkdownChildrenProps = {
  children?: React.ReactNode;
};

const RichMarkdownChildren = ({ children }: RichMarkdownChildrenProps) => {
  return <>{mapRichChildren(children)}</>;
};

export default RichMarkdownChildren;
