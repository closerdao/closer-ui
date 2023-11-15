import { StatusColor } from '../types';

export const STATUS_COLOR: StatusColor = {
  cancelled: 'bg-failure',
  rejected: 'bg-failure',
  open: 'bg-pending',
  pending: 'bg-pending',
  confirmed: 'bg-success',
  paid: 'bg-success',
  'checked-in': 'bg-success',
  'checked-out': 'bg-success',
};
