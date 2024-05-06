import { StatusColor } from '../types';

export const STATUS_COLOR: StatusColor = {
  cancelled: 'failure',
  rejected: 'failure',
  open: 'pending',
  pending: 'pending',
  confirmed: 'pending',
  paid: 'success',
  'credits-paid': 'success',
  'tokens-staked': 'success',
  'checked-in': 'success',
  'checked-out': 'success',
};
