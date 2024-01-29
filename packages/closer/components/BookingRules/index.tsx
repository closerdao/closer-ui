import React from 'react';

import { useConfig } from '../../hooks/useConfig';
import { BookingRule } from '../../types';
import { __ } from '../../utils/helpers';
import { Heading } from '../ui';

interface Props {
  rules: BookingRule[];
}

const BookingRules = ({ rules }: Props) => {
  const { APP_NAME } = useConfig();
  return (
    <section className="max-w-6xl mx-auto mb-16">
      <div className="mb-6">
        <Heading display className="mb-4">
          {__('booking_rules_heading', APP_NAME).includes('__')
            ? __('booking_rules_heading')
            : __('booking_rules_heading', APP_NAME)}
        </Heading>
        <ul className="mb-4 max-w-prose">
          {rules?.map((rule) => (
            <li
              key={rule.title}
              className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
            >
              <b>{rule.title}:</b> {rule.description}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default BookingRules;
