import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { useTranslations } from 'next-intl';

import { api } from '../..';
import { User, Vouched } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { Booking } from '../../types/booking';
import { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { Card, ErrorMessage, Heading, Information, Spinner } from '../ui';
import Button from '../ui/Button';

const Vouching = ({
  userId,
  vouchData,
  myId,
  minVouchingStayDuration,
}: {
  userId: string;
  vouchData: Vouched[];
  myId: string | undefined;
  minVouchingStayDuration: number;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [updatedVouchData, setUpdatedVouchData] = useState(vouchData);

  const hasBeenVouchedByMe = updatedVouchData?.some(
    (vouched: Vouched) => vouched.vouchedBy === myId,
  );
  const bookingsToShowLimit = 5;
  const vouchedUserIds =
    updatedVouchData?.map((vouched: Vouched) => vouched.vouchedBy) || [];

  const filter = useMemo(
    () => ({
      where: {
        createdBy: userId,
        status: [
          'tokens-staked',
          'credits-paid',
          'paid',
          'checked-in',
          'checked-out',
          'pending-refund',
        ],
        end: { $lt: new Date() },
      },
      limit: bookingsToShowLimit,
    }),
    [userId],
  );
  const userFilter = useMemo(
    () => ({
      where: {
        _id: { $in: vouchedUserIds },
      },
      limit: bookingsToShowLimit,
    }),
    [updatedVouchData],
  );

  const pastBookings = platform.booking.find(filter);
  const vouchedUsers = platform.user.find(userFilter);

  const totalStayDays =
    pastBookings?.toJS()?.reduce((acc: number, booking: Booking) => {
      return acc + booking.duration;
    }, 0) || 0;

  console.log('totalStayDays=', totalStayDays);

  const hasStayedForMinDuration = totalStayDays >= minVouchingStayDuration;

  const vouchUser = async () => {
    try {
      setSuccess(false);
      setError(null);
      setLoading(true);

      const res = await api.get(`/users/${userId}/vouch`);
      const updatedUser = res.data.results.user;

      setUpdatedVouchData(updatedUser.vouched);

      setSuccess(true);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.booking.get(filter),
        platform.user.get(userFilter),
      ]);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, userFilter]);

  return (
    <Card className="space-y-2 w-full">
      <Heading level={2} className="text-lg">
        {updatedVouchData?.length > 0
          ? t('vouch_already_vouched_by_users')
          : t('vouch_not_vouched_by_users')}
      </Heading>

      <div className="space-y-4">
        {vouchedUsers?.toJS().map((user: User) => (
          <div key={user._id}>
            <Link
              href={`/members/${user._id}`}
              className="flex items-center gap-2"
            >
              {user.photo ? (
                <Image
                  className="rounded-full"
                  src={`${cdn}${user.photo}-profile-sm.jpg`}
                  alt={user.screenname || ''}
                  width={50}
                  height={50}
                />
              ) : (
                <div className="rounded-full overflow-hidden">
                  <FaUser className="text-neutral w-[50px] h-[50px] " />
                </div>
              )}
              <p className="text-accent">{user.screenname}</p>
            </Link>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        isEnabled={
          hasStayedForMinDuration && !hasBeenVouchedByMe && !loading && !success
        }
        onClick={vouchUser}
        className="flex items-center gap-2"
      >
        {t('vouch_button')} {loading && <Spinner />}
      </Button>
      {!hasStayedForMinDuration && (
        <Information>
          {t('vouch_min_duration_not_met', { var: minVouchingStayDuration })}
        </Information>
      )}
      {hasBeenVouchedByMe && (
        <Information>{t('vouch_already_vouched')}</Information>
      )}
      {error && <ErrorMessage error={error} />}
    </Card>
  );
};

export default Vouching;
