import type { Stay } from '../../types/stay';
import {
  canEditStayPreparation,
  getStayCheckoutPath,
} from '../stayPaymentRouting.helpers';

const stay = (extra: Partial<Stay> = {}) =>
  ({ _id: 'stay', createdBy: 'guest', status: 'confirmed', ...extra }) as Stay;

test.each([
  ['draft', '/stay/create/stay'],
  ['open', '/stay/create/stay'],
  ['pending', '/stay/stay/pending'],
  ['confirmed', '/stay/stay/payment'],
  ['pending-payment', '/stay/stay/payment'],
  ['tokens-staked', '/stay/stay/payment'],
  ['credits-paid', '/stay/stay/payment'],
  ['paid', '/stay/stay/confirmation'],
  ['cancelled', '/stay/stay'],
  ['rejected', '/stay/stay'],
  ['pending-refund', '/stay/stay'],
  ['checked-in', '/stay/stay'],
  ['checked-out', '/stay/stay'],
  ['unknown', '/stay/stay'],
])('routes %s to its booking stage', (status, path) => {
  expect(getStayCheckoutPath(stay({ status: status as Stay['status'] }))).toBe(
    path,
  );
});

test.each([undefined, 0, 0.000001, 4])(
  'keeps an unpaid token or credit stay on payment even with balance %s',
  (val) => {
    expect(
      getStayCheckoutPath(
        stay({ tokensTarget: val == null ? undefined : { val, cur: 'TDF' } }),
      ),
    ).toBe('/stay/stay/payment');
  },
);

const held = {
  id: 'hold',
  status: 'pending-payment',
  requestedBy: 'guest',
  expiresAt: '2099-01-01',
  quote: { fiatDelta: 80 },
} as Stay['pendingModification'];
test('a payable held change on a paid stay routes to payment, including while settling', () => {
  for (const status of ['pending-payment', 'settling'] as const) {
    expect(
      getStayCheckoutPath(
        stay({ status: 'paid', pendingModification: { ...held!, status } }),
      ),
    ).toBe('/stay/stay/payment');
  }
});
test('expired or host-requested holds do not reopen a paid booking checkout', () => {
  for (const extra of [{ expiresAt: '2020-01-01' }, { requestedBy: 'host' }]) {
    expect(
      getStayCheckoutPath(
        stay({ status: 'paid', pendingModification: { ...held!, ...extra } }),
      ),
    ).toBe('/stay/stay/confirmation');
  }
});
test('an explicit preparation edit cannot alter a residency or a held change', () => {
  expect(canEditStayPreparation(stay())).toBe(true);
  expect(canEditStayPreparation(stay({ pendingModification: held }))).toBe(
    false,
  );
  expect(canEditStayPreparation(stay({ residencyAgreementId: 'season' }))).toBe(
    false,
  );
});
