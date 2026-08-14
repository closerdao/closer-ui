import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { Modal, api } from '../..';
import { User, Vouched } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';
import { ErrorMessage, Information, Spinner, Textarea } from '../ui';
import Button from '../ui/Button';

const MAX_VOUCHERS_TO_LOAD = 100;

const getVouchedFromResponse = (
  res: { data?: { results?: { user?: User } } },
): Vouched[] | undefined => res?.data?.results?.user?.vouched;

const Vouching = ({
  userId,
  memberName,
  vouchData,
  myId,
  minVouchingStayDuration,
}: {
  userId: string;
  memberName?: string;
  vouchData: Vouched[];
  myId: string | undefined;
  minVouchingStayDuration: number;
}) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updatedVouchData, setUpdatedVouchData] = useState(vouchData);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [isEditingVouch, setIsEditingVouch] = useState(false);
  const [vouchMessage, setVouchMessage] = useState('');
  const [totalNights, setTotalNights] = useState<number | null>(null);

  const isOwnProfile = Boolean(myId) && myId === userId;
  const myVouch = updatedVouchData?.find(
    (vouched: Vouched) => vouched.vouchedBy === myId,
  );
  const hasBeenVouchedByMe = Boolean(myVouch);
  const vouchedUserIds =
    updatedVouchData?.map((vouched: Vouched) => vouched.vouchedBy) || [];

  const userFilter = useMemo(
    () => ({
      where: {
        _id: { $in: vouchedUserIds },
      },
      limit: MAX_VOUCHERS_TO_LOAD,
    }),
    [updatedVouchData],
  );

  const vouchedUsers = platform.user.find(userFilter);

  const hasStayedForMinDuration =
    totalNights !== null && totalNights >= minVouchingStayDuration;

  const vouches = useMemo(() => {
    const vouchersById = new Map<string, User>(
      (vouchedUsers?.toJS() || []).map((user: User) => [user._id, user]),
    );

    return [...(updatedVouchData || [])]
      .sort(
        (a, b) =>
          new Date(b.vouchedAt).getTime() - new Date(a.vouchedAt).getTime(),
      )
      .map((vouch: Vouched) => ({
        ...vouch,
        voucher: vouchersById.get(vouch.vouchedBy),
      }));
  }, [updatedVouchData, vouchedUsers]);

  useEffect(() => {
    loadData();
  }, [userId, userFilter]);

  const applyVouchedUpdate = (
    res: { data?: { results?: { user?: User } } },
    fallback: Vouched[],
  ) => {
    const next = getVouchedFromResponse(res);
    setUpdatedVouchData(Array.isArray(next) ? next : fallback);
  };

  const vouchUser = async () => {
    try {
      setSuccess(false);
      setError(null);
      setLoading(true);

      const res = await api.post(`/users/${userId}/vouch`, {
        message: vouchMessage,
      });

      applyVouchedUpdate(res, [
        ...(updatedVouchData || []),
        {
          vouchedBy: myId || '',
          vouchedAt: new Date(),
          message: vouchMessage,
        },
      ]);
      setIsInfoModalOpened(false);
      setIsEditingVouch(false);
      setSuccess(true);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateVouch = async () => {
    try {
      setSuccess(false);
      setError(null);
      setLoading(true);

      const res = await api.patch(`/users/${userId}/vouch`, {
        message: vouchMessage,
      });

      applyVouchedUpdate(
        res,
        (updatedVouchData || []).map((vouch: Vouched) =>
          vouch.vouchedBy === myId ? { ...vouch, message: vouchMessage } : vouch,
        ),
      );
      setIsInfoModalOpened(false);
      setIsEditingVouch(false);
      setSuccess(true);
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  };

  const deleteVouch = async () => {
    if (!window.confirm(t('vouch_delete_confirm', { name: memberName || '' }))) {
      return;
    }

    try {
      setSuccess(false);
      setError(null);
      setLoading(true);

      const res = await api.delete(`/users/${userId}/vouch`);

      applyVouchedUpdate(
        res,
        (updatedVouchData || []).filter(
          (vouch: Vouched) => vouch.vouchedBy !== myId,
        ),
      );
    } catch (error) {
      setError(parseMessageFromError(error));
    } finally {
      setLoading(false);
    }
  };

  async function loadData() {
    try {
      setLoading(true);
      const [staysRes] = await Promise.all([
        api.get(`/stays/nights/${userId}`),
        platform.user.get(userFilter),
      ]);
      setTotalNights(Number(staysRes?.data?.results?.totalNights) || 0);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setVouchMessage('');
    setIsEditingVouch(false);
    setError(null);
    setSuccess(false);
    setIsInfoModalOpened(true);
  };

  const openEditModal = () => {
    setVouchMessage(myVouch?.message || '');
    setIsEditingVouch(true);
    setError(null);
    setSuccess(false);
    setIsInfoModalOpened(true);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
    setIsEditingVouch(false);
  };

  const canSubmitVouch =
    !loading &&
    !success &&
    vouchMessage.trim().length > 0 &&
    (isEditingVouch || (hasStayedForMinDuration && !hasBeenVouchedByMe));

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-xl">{t('members_slug_vouching')}</h4>
        {vouches.length > 0 && (
          <span className="text-sm text-gray-500">
            {t('vouch_count', { count: vouches.length })}
          </span>
        )}
      </div>

      {vouches.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {vouches.map((vouch) => {
            const voucher = vouch.voucher;
            const isMyVouch = Boolean(myId) && vouch.vouchedBy === myId;
            const avatar = voucher?.photo ? (
              <Image
                className="rounded-full"
                src={`${cdn}${voucher.photo}-profile-sm.jpg`}
                alt={voucher.screenname || ''}
                width={48}
                height={48}
              />
            ) : (
              <UserAvatarPlaceholder size="xl" />
            );

            return (
              <li
                key={`${vouch.vouchedBy}-${String(vouch.vouchedAt)}`}
                className="flex gap-4 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
              >
                <div className="shrink-0">
                  {voucher ? (
                    <Link href={`/members/${voucher._id}`}>{avatar}</Link>
                  ) : (
                    avatar
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {voucher ? (
                      <Link
                        href={`/members/${voucher._id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {voucher.screenname}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {t('vouch_unknown_member')}
                      </span>
                    )}
                    {vouch.vouchedAt && (
                      <span className="text-xs text-gray-500">
                        {dayjs(vouch.vouchedAt).format('MMMM YYYY')}
                      </span>
                    )}
                  </div>
                  {vouch.message && (
                    <p className="whitespace-pre-line text-sm">
                      {vouch.message}
                    </p>
                  )}
                  {isMyVouch && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-sm text-accent hover:underline"
                        onClick={openEditModal}
                      >
                        {t('generic_edit_button')}
                      </button>
                      <button
                        type="button"
                        className="text-sm text-gray-400 hover:text-red-500"
                        onClick={deleteVouch}
                        disabled={loading}
                      >
                        {t('generic_delete_button')}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 italic">
          {isOwnProfile
            ? t('vouch_none_yet_own_profile')
            : t('vouch_none_yet', { name: memberName || '' })}
        </p>
      )}

      {!isOwnProfile && !hasBeenVouchedByMe && (
        <div className="mt-4 flex flex-col gap-3 rounded-md border-2 border-dashed border-accent/50 p-4">
          <p>
            {vouches.length > 0
              ? t('vouch_encourage_add', { name: memberName || '' })
              : t('vouch_encourage_be_first', { name: memberName || '' })}
          </p>
          <Button
            variant="primary"
            size="small"
            isFullWidth={false}
            isEnabled={hasStayedForMinDuration && !loading}
            onClick={openCreateModal}
            className="flex items-center gap-2"
          >
            {t('vouch_button')} {loading && <Spinner />}
          </Button>
          {totalNights !== null && !hasStayedForMinDuration && (
            <Information>
              {t('vouch_min_duration_not_met', {
                var: minVouchingStayDuration,
              })}
            </Information>
          )}
        </div>
      )}
      {error && <ErrorMessage error={error} />}

      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          <div className="flex flex-col gap-5 min-w-[160px] h-full justify-center">
            <label className="font-medium" htmlFor="vouch-message">
              {t('vouch_why_vouch', { name: memberName || '' })}
            </label>
            <Textarea
              id="vouch-message"
              rows={5}
              placeholder={t('vouch_message_placeholder')}
              value={vouchMessage}
              onChange={(e) => setVouchMessage(e.target.value)}
            />
            <Button
              variant="primary"
              isEnabled={canSubmitVouch}
              onClick={isEditingVouch ? updateVouch : vouchUser}
              className="flex items-center gap-2"
            >
              {isEditingVouch ? t('generic_save_button') : t('vouch_button')}{' '}
              {loading && <Spinner />}
            </Button>
            {error && <ErrorMessage error={error} />}
          </div>
        </Modal>
      )}
    </>
  );
};

export default Vouching;
