import Link from 'next/link';

import { FC } from 'react';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { MdLocationOn } from '@react-icons/all-files/md/MdLocationOn';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { cdn } from '../../utils/api';
import { __ } from '../../utils/helpers';

dayjs.extend(advancedFormat);

interface Props {
  startDate: string;
  endDate: string;
  photo: string;
  description: string;
  name: string;
  slug: string;
}

const VolunteerCard: FC<Props> = ({
  startDate,
  endDate,
  photo,
  description,
  name,
  slug,
}) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const duration = end && end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMMM Do HH:mm' : 'YYYY MMMM Do HH:mm';
  return (
    <div className="card">
      <h2>{name}</h2>
      <div className="flex flex-row items-center py-3 space-x-1 mt-2 text-gray-500">
        <FaCalendarAlt />
        <p className="text-xs font-light">
          {start && start.format(dateFormat)}
          {end && duration <= 24 && ` - ${end.format('HH:mm')}`}
          {end && duration >= 24 && ` - ${end.format(dateFormat)}`}
        </p>
      </div>
      <div className="flex flex-row items-center py-3 space-x-1 mt-2 text-gray-500">
        <MdLocationOn />
        <p className="text-sm">Traditional Dream Factory, Abela</p>
      </div>

      <div className="flex flex-row items-center">
        <img src={`${cdn}${photo}-max-lg.jpg`} alt={description} />
      </div>
      <p className="py-3">{description}</p>
      <div className="mt-4 py-3">
        <Link href={`/volunteer/${slug}/checkout`}>
          <button className="btn-primary">{__('apply_submit_button')}</button>
        </Link>
      </div>
    </div>
  );
};

export default VolunteerCard;
