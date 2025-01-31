import { FC, MouseEventHandler } from 'react';

import { useTranslations } from 'next-intl';

const BookingBackButton: FC<{
  name?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}> = ({ name, onClick }) => {
  const t = useTranslations();

  const goBack = () => {
    window.history.back();
  };
  return <button onClick={onClick || goBack}>{name || t('buttons_back')}</button>;
};

export default BookingBackButton;
