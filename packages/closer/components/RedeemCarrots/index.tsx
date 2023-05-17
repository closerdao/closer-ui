import React from 'react';
import { Button, Card, Heading } from '../ui';
import { __ } from '../../utils/helpers';

const RedeemCarrots = () => {
    return (
        <div>
            <Card className="text-center gap-4">
          <Heading level={2}>{__('carrots_heading_redeem')}</Heading>
          <Heading level={2} className="text-6xl">
            🥕
          </Heading>

          <p className="mb-4">{__('carrots_get_discount')}</p>
          <div className="flex w-full justify-center items-center mb-6">
            <div className='w-2/5'>
              <Heading level={4}>5</Heading>
              <div className='text-xs'>{__('carrots_max_available')}</div>
            </div>
            <div className='w-1/10'>
            <Heading level={4}>=</Heading>
            </div>
            <div className='w-2/5'>
              
            <Heading level={4}>-150</Heading>
              <div className='text-xs'>{__('carrots_off_accommodation')}</div>
            </div>
          </div>
            <Button>{__('carrots_button_apply_discount')}</Button>
            <Button type='secondary' className='!text-accent'>{__('carrots_button_save')}</Button>
        </Card>
        </div>
    );
};

export default RedeemCarrots;