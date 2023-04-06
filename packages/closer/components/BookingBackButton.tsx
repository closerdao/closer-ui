import { FC, MouseEventHandler } from 'react';
import React from 'react';

import { __ } from '../utils/helpers';

const BookingBackButton: FC<{
  name?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}> = ({ name = __('buttons_go_back'), onClick }) => {
  const goBack = () => {
    window.history.back();
  };
  return <button onClick={onClick || goBack}>{name}</button>;
};

export default BookingBackButton;
