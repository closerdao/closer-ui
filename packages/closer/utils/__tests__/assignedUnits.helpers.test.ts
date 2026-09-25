import { createTranslator } from 'next-intl';

import messagesEn from '../../locales/base-en.json';
import messagesPl from '../../locales/base-pl.json';
import messagesPt from '../../locales/base-pt.json';
import { formatAssignedUnits } from '../assignedUnits.helpers';

const tEn = createTranslator({ locale: 'en', messages: messagesEn });

const glamping = { name: 'Small Glamping', private: true, quantity: 3 };
const dorm = { name: 'Shared Dorm', private: false, quantity: 1 };

describe('formatAssignedUnits', () => {
  it('names the unit of a private listing', () => {
    expect(formatAssignedUnits(glamping, [1], tEn)).toBe('Small Glamping 1');
    expect(formatAssignedUnits(glamping, [1, 3], tEn)).toBe(
      'Small Glamping 1, Small Glamping 3',
    );
  });

  it('uses the bare name when a private listing has one unit', () => {
    expect(formatAssignedUnits({ ...glamping, quantity: 1 }, [1], tEn)).toBe(
      'Small Glamping',
    );
  });

  it('lists the beds of a shared listing', () => {
    expect(formatAssignedUnits(dorm, [2, 3], tEn)).toBe(
      'Beds 2, 3 in Shared Dorm',
    );
    expect(formatAssignedUnits(dorm, [2], tEn)).toBe('Bed 2 in Shared Dorm');
  });

  it('accepts a single number', () => {
    expect(formatAssignedUnits(glamping, 2, tEn)).toBe('Small Glamping 2');
  });

  it('is empty until a unit is assigned', () => {
    expect(formatAssignedUnits(glamping, undefined, tEn)).toBe('');
    expect(formatAssignedUnits(glamping, [], tEn)).toBe('');
    expect(formatAssignedUnits(dorm, null, tEn)).toBe('');
  });

  it('translates the shared-bed copy and the may-change label', () => {
    const tPt = createTranslator({ locale: 'pt', messages: messagesPt });
    const tPl = createTranslator({ locale: 'pl', messages: messagesPl });
    expect(formatAssignedUnits(dorm, [2, 3], tPt)).toBe(
      'Camas 2, 3 em Shared Dorm',
    );
    expect(formatAssignedUnits(dorm, [2, 3], tPl)).toBe(
      'Łóżka 2, 3 w Shared Dorm',
    );
    expect(tEn('booking_assigned_unit_may_change')).toBe(
      '(may change until check-in)',
    );
    expect(tPt('booking_assigned_unit_may_change')).toBe(
      '(pode mudar até ao check-in)',
    );
    expect(tPl('booking_assigned_unit_may_change')).toBe(
      '(może się zmienić do zameldowania)',
    );
  });
});
