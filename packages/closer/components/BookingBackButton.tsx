import { FC, MouseEventHandler } from 'react';

import { useTranslations } from 'next-intl';

import { IconChevronLeft } from './BookingIcons';

const BookingBackButton: FC<{
  name?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}> = ({ name, onClick, className }) => {
  const t = useTranslations();

  const goBack = () => {
    window.history.back();
  };
  const label = (name || t('buttons_back')).replace(/^<\s*/, '');
  return (
    <button
      type="button"
      onClick={onClick || goBack}
      className={`shrink-0 py-2 flex items-center gap-1.5 text-foreground hover:opacity-80 ${className ?? ''}`}
    >
      <IconChevronLeft className="!mr-0" />
      {label}
    </button>
  );
};

export default BookingBackButton;
