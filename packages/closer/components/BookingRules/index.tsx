import { useTranslations } from 'next-intl';

import { BookingRule } from '../../types';
import { Heading } from '../ui';

interface Props {
  rules: BookingRule[];
}

const BookingRules = ({ rules }: Props) => {
  const t = useTranslations();
  return (
    <section className="max-w-6xl mx-auto mb-16">
      <div className="mb-6">
        <Heading display className="mb-4">
          {t('booking_rules_heading').includes('__')
            ? t('booking_rules_heading')
            : t('booking_rules_heading')}
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
