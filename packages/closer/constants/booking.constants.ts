import { StatusColor } from '../types';

export const STATUS_COLOR: StatusColor = {
  cancelled: 'failure',
  rejected: 'failure',
  open: 'pending',
  pending: 'pending',
  confirmed: 'success',
  paid: 'success',
  'checked-in': 'success',
  'checked-out': 'success',
};
