import { Fragment, useMemo } from 'react';

import { parseInlineSegments } from '../../utils/display.helpers';

import EmailDisplay from './emailDisplay';
import ExternalLinkDisplay from './externalLinkDisplay';
import WalletDisplay from './walletDisplay';

type Props = {
  text: string;
};

const InlineFormattedSegments = ({ text }: Props) => {
  const segments = useMemo(() => parseInlineSegments(text), [text]);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <Fragment key={i}>{seg.value}</Fragment>;
        }
        if (seg.type === 'wallet') {
          return (
            <WalletDisplay
              key={`${i}-${seg.value}`}
              address={seg.value}
              variant="inline"
              className="mx-0.5 align-middle"
            />
          );
        }
        if (seg.type === 'email') {
          return (
            <EmailDisplay
              key={`${i}-${seg.value}`}
              email={seg.value}
              className="mx-0.5 align-middle"
            />
          );
        }
        return (
          <ExternalLinkDisplay
            key={`${i}-${seg.value}`}
            href={seg.value}
            className="mx-0.5 align-middle text-inherit underline"
          />
        );
      })}
    </>
  );
};

export default InlineFormattedSegments;
