import Image from 'next/image';
import Link from 'next/link';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { FaCheckCircle } from '@react-icons/all-files/fa/FaCheckCircle';
import { FaClock } from '@react-icons/all-files/fa/FaClock';
import { FaUserCheck } from '@react-icons/all-files/fa/FaUserCheck';
import { FaChevronDown } from '@react-icons/all-files/fa/FaChevronDown';
import { FaChevronUp } from '@react-icons/all-files/fa/FaChevronUp';
import { FaHome } from '@react-icons/all-files/fa/FaHome';
import { FaStar } from '@react-icons/all-files/fa/FaStar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslations } from 'next-intl';

import { ACTIONS, USER_ROLE_OPTIONS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import api, { cdn } from '../../utils/api';
import Counter from '../Counter';
import Modal from '../Modal';
import Pagination from '../Pagination';
import {
  Button,
  Card,
  Checkbox,
  ErrorMessage,
  Heading,
  Input,
  Spinner,
} from '../ui';
import Select from '../ui/Select/Dropdown';

dayjs.extend(relativeTime);

const USERS_PER_PAGE = 50;
const MAX_USERS_TO_FETCH = 2000;

interface Props {
  where: any;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
}

const UsersList = ({ where, page, setPage, sortBy, setSortBy }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user: currentUser } = useAuth();

  const updatedWhere = useMemo(() => where, [where]);
  const updatedPage = useMemo(() => page, [page]);

  const filter = {
    where: updatedWhere,
    limit: USERS_PER_PAGE,
    sort_by: sortBy,
    page: updatedPage,
  };

  const filteredUsers = platform.user.find(filter);
  const totalUsers = platform.user.findCount(filter);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [action, setAction] = useState<string | null>(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creditsToSend, setCreditsToSend] = useState(1);
  const [reasonToSendCredits, setReasonToSendCredits] = useState('');
  const [error, setError] = useState<any>();
  const [success, setSuccess] = useState(false);
  const [usersEmails, setUsersEmails] = useState<any[]>([]);
  const [csvData, _setCsvData] = useState<any>(null);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.user.get(filter),
        platform.user.getCount(filter),
      ]);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUserData = async () => {
    try {
      setIsLoading(true);
      const allUserData = await platform.user.get({
        limit: MAX_USERS_TO_FETCH,
        sort_by: 'screenname',
      });
      return allUserData;
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, sortBy]);

  useEffect(() => {
    loadData();
    setSelectedUsers([]);
  }, [where]);

  useEffect(() => {
    if (!copied) {
      closeModal();
    }
  }, [copied]);

  const handleAddRole = async (role: string, user?: any) => {
    if (typeof user !== 'undefined') {
      if (!user.get('roles').includes(role)) {
        try {
          await platform.user.patch(user.get('_id'), {
            roles: user.get('roles').concat(role),
          });
          setSuccess(true);
        } catch (error: any) {
          setError(error);
        }
      }
    } else {
      selectedUsers.forEach(async (selectedUser) => {
        if (!selectedUser.get('roles').includes(role)) {
          try {
            await platform.user.patch(selectedUser.get('_id'), {
              roles: selectedUser.get('roles').concat(role),
            });
            setSuccess(true);
          } catch (error: any) {
            setError(error);
          }
        }
      });
    }
  };

  const handleRemoveRole = async (role: string, user?: any) => {
    if (typeof user !== 'undefined') {
      platform.user.patch(user.get('_id'), {
        roles: user.get('roles').filter((r: string) => r !== role),
      });
    } else {
      selectedUsers.forEach(async (selectedUser) => {
        try {
          await platform.user.patch(selectedUser.get('_id'), {
            roles: selectedUser.get('roles').filter((r: string) => r !== role),
          });
          setSuccess(true);
        } catch (error: any) {
          setError(error);
        }
      });
    }
  };

  const handleUserSelect = (user: any) => {
    if (
      selectedUsers.some(
        (selectedUser) => selectedUser.get('_id') === user.get('_id'),
      )
    ) {
      setSelectedUsers(
        selectedUsers.filter(
          (selectedUser) => selectedUser.get('_id') !== user.get('_id'),
        ),
      );
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.toArray().length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.toArray());
    }
  };

  const handleAction = async (action: string) => {
    openModal();
    setAction(action);
    setSuccess(false);
    setError(null);

    switch (action) {
      case 'Copy emails':
        {
          const emails = selectedUsers.map((user) => user.get('email'));
          copyToClipboard(emails.join());
        }
        break;
      case 'Export selected (CSV)':
        // No CSV export in the new version
        break;
      case 'Export all':
        const _data = await getAllUserData();
        // No CSV export in the new version
        break;
      case 'Unlink wallet':
        {
          const emails = selectedUsers.map((user) => user.get('email'));
          setUsersEmails(emails);
        }
        break;

      default:
        break;
    }
  };

  const openModal = () => {
    setIsInfoModalOpened(true);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  const handleSendCredits = async () => {
    setReasonToSendCredits('');
    try {
      await api.post('/carrots/award/batch', {
        users: selectedUsers.map((user) => user.get('email')),
        amount: creditsToSend,
        reason: `${reasonToSendCredits}. Sent by: ${currentUser?.screenname}`,
      });
      setSuccess(true);
    } catch (error: any) {
      setError(error);
    }
  };

  const handleUnlinkUserWallet = async () => {
    try {
      usersEmails.forEach(async (usersEmail) => {
        api.post('/auth/web3/unlink', { email: usersEmail });
      });
      setSuccess(true);
    } catch (error) {
      setError(error);
    }
  };

  return (
    <section className="flex gap-2 flex-col min-h-[500px]">
      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          {action === 'Add role' && (
            <div className="flex flex-col gap-4">
              <Heading level={4}>{t('manage_users_add_role')}</Heading>
              <div className="font-bold">
                {selectedUsers
                  .map((user) => {
                    return `${user.get('screenname')}`;
                  })
                  .join(', ')}
              </div>
              <Select
                className="rounded-full text-accent border-accent text-xs py-0.5 px-1.5"
                value={t('manage_users_add_role_button')}
                options={USER_ROLE_OPTIONS.slice(1)}
                onChange={(value: string) => handleAddRole(value)}
                isRequired
                placeholder={t('manage_users_add_role_button')}
              />
              {success && (
                <div className="text-success text-center">
                  {t('manage_users_role_added')}
                </div>
              )}
            </div>
          )}
          {action === 'Remove role' && (
            <div className="flex flex-col gap-4">
              <Heading level={4}>{t('manage_users_remove_role')}</Heading>
              <div className="font-bold">
                {selectedUsers
                  .map((user) => {
                    return `${user.get('screenname')}`;
                  })
                  .join(', ')}
              </div>
              <Select
                className="rounded-full text-accent border-accent "
                value={t('manage_users_remove_role')}
                options={USER_ROLE_OPTIONS.slice(1)}
                onChange={(value: string) => handleRemoveRole(value)}
                isRequired
                placeholder={t('manage_users_remove_role')}
              />
              {success && (
                <div className="text-success text-center">
                  {t('manage_users_role_removed')}
                </div>
              )}
            </div>
          )}
          {action === 'Send carrots' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{t('manage_users_send_credits')}</Heading>

              <div className="font-bold">
                {selectedUsers
                  .map((user) => {
                    return `${user.get('screenname')}`;
                  })
                  .join(', ')}
              </div>

              <Input
                onChange={(e: any) => setReasonToSendCredits(e.target.value)}
                value={reasonToSendCredits}
                placeholder={t('manage_users_reason_to_send_credits')}
              />
              <div className="flex space-between items-center">
                <p className="flex-1">{t('manage_users_how_many_credits')}</p>
                <Counter
                  value={creditsToSend}
                  setFn={setCreditsToSend}
                  minValue={1}
                />
              </div>

              {error && <ErrorMessage error={error} />}

              <Button
                onClick={handleSendCredits}
                isEnabled={Boolean(!success && reasonToSendCredits)}
              >
                {t('manage_users_send_credits_button')}
              </Button>

              {success && (
                <div className="text-success text-center">
                  {t('manage_users_credits_sent')}
                </div>
              )}
            </div>
          )}

          {action === 'Export selected (CSV)' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{t('manage_users_export')}</Heading>

              {csvData && (
                <Button
                  className="bg-accent rounded-full w-full py-3 text-center px-4 text-white uppercase"
                  onClick={() => {
                    const headers = csvData.headers
                      .map((h: any) => h.label)
                      .join(',');
                    const rows = csvData.data.map((row: any) =>
                      Object.values(row).join(','),
                    );
                    const csvContent = [headers, ...rows].join('\n');
                    const blob = new Blob([csvContent], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'data.csv';
                    link.click();
                    URL.revokeObjectURL(link.href);
                  }}
                >
                  {t('manage_users_save_button')}
                </Button>
              )}
            </div>
          )}
          {action === 'Export all' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{t('manage_users_export_all')}</Heading>

              {csvData ? (
                <Button
                  className="bg-accent rounded-full w-full py-3 text-center px-4 text-white uppercase"
                  onClick={() => {
                    const headers = csvData.headers
                      .map((h: any) => h.label)
                      .join(',');
                    const rows = csvData.data.map((row: any) =>
                      Object.values(row).join(','),
                    );
                    const csvContent = [headers, ...rows].join('\n');
                    const blob = new Blob([csvContent], {
                      type: 'text/csv;charset=utf-8;',
                    });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'data.csv';
                    link.click();
                    URL.revokeObjectURL(link.href);
                  }}
                >
                  {t('manage_users_save_button')}
                </Button>
              ) : (
                <>{t('manage_users_preparing_data')}</>
              )}
            </div>
          )}

          {action === 'Copy emails' && (
            <div className="font-bold">{t('manage_users_emails_copied')}</div>
          )}

          {action === 'Unlink wallet' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{t('admin_unlink_wallet')}</Heading>
              <div className="flex flex-col gap-6 my-4">
                <Heading level={3}>
                  {t('admin_unlink_wallet_disclaimer')}
                </Heading>

                <div className="font-bold">
                  {selectedUsers
                    .map((user) => {
                      return `${user.get('email')}`;
                    })
                    .join(', ')}
                </div>

                <Button onClick={handleUnlinkUserWallet}>
                  {t('admin_unlink_wallet_button')}
                </Button>
              </div>
              {error && <ErrorMessage error={error} />}
              {success && (
                <div className="text-success text-center">
                  {t('admin_unlink_wallet_success')}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {isLoading ? (
        <div className="my-16 flex items-center gap-2">
          <Spinner /> {t('generic_loading')}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center border-b pb-2">
            <Heading level={2}>
              {totalUsers ? totalUsers.toString() : 0}{' '}
              {totalUsers === 1
                ? t('manage_users_user')
                : t('manage_users_users')}
            </Heading>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600 min-w-[80px]">{t('manage_users_sort_by')}</label>
              <Select
                className="min-w-[200px] border-gray-300 rounded-lg"
                value={sortBy}
                options={[
                  { value: '-created', label: t('manage_users_sort_by_created_desc') },
                  { value: 'created', label: t('manage_users_sort_by_created_asc') },
                  { value: '-screenname', label: t('manage_users_sort_by_name_desc') },
                  { value: 'screenname', label: t('manage_users_sort_by_name_asc') },
                  { value: '-lastactive', label: t('manage_users_sort_by_lastactive_desc') },
                  { value: 'lastactive', label: t('manage_users_sort_by_lastactive_asc') },
                  { value: '-email', label: t('manage_users_sort_by_email_desc') },
                  { value: 'email', label: t('manage_users_sort_by_email_asc') },
                  { value: '-stats.wallet.tdf', label: t('manage_users_sort_by_token_balance_desc') },
                  { value: 'stats.wallet.tdf', label: t('manage_users_sort_by_token_balance_asc') },
                ]}
                onChange={setSortBy}
                isRequired
              />
            </div>
          </div>

          <div className="flex gap-3 justify-between my-4 flex-col sm:flex-row">
            <div className="flex">
              <Checkbox
                id="selectAll"
                isChecked={Boolean(
                  filteredUsers &&
                    selectedUsers.length === filteredUsers.toJS().length,
                )}
                onChange={handleSelectAllUsers}
              />
              <label htmlFor="selectAll" className="uppercase font-bold ">
                {t('manage_users_select_all')}
              </label>
            </div>

            <div className="w-[300px] flex gap-2 flex-col sm:flex-row">
              <div className="w-1/3 whitespace-nowrap font-bold  flex justify-start sm:justify-end items-center">
                {selectedUsers.length && selectedUsers.length}{' '}
                {t('manage_users_selected')}
              </div>
              <div className="w-2/3">
                <Select
                  className="rounded-full text-accent border-accent uppercase"
                  value={t('manage_users_actions')}
                  options={ACTIONS}
                  onChange={(action: string) => handleAction(action)}
                  isRequired
                  placeholder={t('manage_users_actions')}
                  isDisabled={Boolean(!selectedUsers.length)}
                />
              </div>
            </div>
          </div>

          {filteredUsers &&
            filteredUsers.map((row: any) => {
              const user = platform.user.findOne(row.get('_id'));
              const isExpanded = expandedUsers.includes(user.get('_id'));
              const citizenDate = user.getIn(['citizenship', 'date']);
              const presence = user.getIn(['stats', 'presence']);
              const vouches = user.get('vouched');
              const tokenBalance = user.getIn(['stats', 'wallet', 'tdf']);

              return (
                <Card
                  className={`py-2 text-sm ${
                    selectedUsers.some(
                      (selectedUser) =>
                        selectedUser.get('_id') === user.get('_id'),
                    ) && 'bg-accent-light'
                  }`}
                  key={user.get('email')}
                >
                  <div className="flex flex-col">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="flex gap-2 items-center min-w-0 flex-shrink-0">
                        <Checkbox
                          isChecked={selectedUsers.some(
                            (selectedUser) =>
                              selectedUser.get('_id') === user.get('_id'),
                          )}
                          onChange={() => handleUserSelect(user)}
                        />
                        <div className="flex-shrink-0">
                          {user.get('photo') ? (
                            <Image
                              src={`${cdn}${user.get('photo')}-profile-sm.jpg`}
                              alt={user.get('screenname')}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <FaUser className="text-gray-400 w-8 h-8 p-1 bg-gray-100 rounded-full" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link
                            className="hover:text-accent font-medium truncate"
                            href={`/members/${user.get('slug')}`}
                          >
                            {user.get('screenname')}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {dayjs(new Date()).from(user.get('created'), true)} ago
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center justify-start">
                        {user.get('kycPassed') && (
                          <div className="bg-blue-100 flex border px-1.5 py-0.5 gap-1 border-blue-400 rounded items-center" title={t('manage_users_kyc_passed')}>
                            <FaCheckCircle className="text-blue-600 w-3 h-3" />
                            <span className="text-xs text-blue-700">KYC</span>
                          </div>
                        )}

                        {vouches && vouches.length > 0 && (
                          <div className="bg-green-100 flex border px-1.5 py-0.5 gap-1 border-green-400 rounded items-center">
                            <FaUserCheck className="text-green-600 w-3 h-3" />
                            <span className="text-xs text-green-700">{vouches.length}</span>
                          </div>
                        )}

                        {tokenBalance > 0 && (
                          <div className="bg-purple-100 flex border px-1.5 py-0.5 gap-1 border-purple-400 rounded items-center">
                            <span className="text-xs text-purple-700 font-medium">
                              {parseFloat(tokenBalance || 0).toFixed(0)} $TDF
                            </span>
                          </div>
                        )}

                        {presence && presence.get('totalNights') > 0 && (
                          <div className="bg-orange-100 flex border px-1.5 py-0.5 gap-1 border-orange-400 rounded items-center">
                            <FaHome className="text-orange-600 w-3 h-3" />
                            <span className="text-xs text-orange-700">{presence.get('totalNights')}n</span>
                          </div>
                        )}

                        {citizenDate && (
                          <div className="bg-yellow-100 flex border px-1.5 py-0.5 gap-1 border-yellow-500 rounded items-center">
                            <FaStar className="text-yellow-600 w-3 h-3" />
                            <span className="text-xs text-yellow-700">{t('manage_users_citizen')}</span>
                          </div>
                        )}

                        {user.get('subscription')?.get('plan') && (
                          <div className="bg-white flex border px-1.5 py-0.5 border-gray-300 rounded gap-1 items-center">
                            <Image
                              src={`/images/admin/icon-${user.get('subscription').get('plan')}.png`}
                              alt={user.get('subscription').get('plan')}
                              width={14}
                              height={14}
                            />
                            <span className="text-xs text-gray-700">
                              {user.get('subscription').get('plan').slice(0, 1).toUpperCase() +
                                user.get('subscription').get('plan').slice(1)}
                            </span>
                          </div>
                        )}

                        {user.get('roles').includes('member') && (
                          <span className="px-1.5 py-0.5 text-xs bg-accent text-white rounded">
                            {t('manage_users_role_member')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                        <Select
                          className="rounded text-xs border-gray-300 min-w-[90px]"
                          value=""
                          options={USER_ROLE_OPTIONS.slice(1)}
                          onChange={(value: string) => handleAddRole(value, user)}
                          isRequired
                          placeholder="+ Role"
                        />

                        <button
                          onClick={() => toggleUserExpanded(user.get('_id'))}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <FaChevronUp className="w-3 h-3 text-gray-500" />
                          ) : (
                            <FaChevronDown className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-500 font-medium">{t('manage_users_account_info')}</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <FaClock className="w-3 h-3 text-gray-400" />
                            {t('manage_users_joined')}: {dayjs(user.get('created')).format('MMM D, YYYY')}
                          </div>
                          {user.get('lastactive') && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <FaClock className="w-3 h-3 text-gray-400" />
                              {t('manage_users_last_active')}: {dayjs(user.get('lastactive')).fromNow()}
                            </div>
                          )}
                          {citizenDate && (
                            <div className="flex items-center gap-1 text-green-700">
                              <FaStar className="w-3 h-3 text-green-500" />
                              {t('manage_users_citizen_since')}: {dayjs(citizenDate).format('MMM D, YYYY')}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-600">
                            {user.get('email')}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-500 font-medium">{t('manage_users_presence_stats')}</span>
                          {presence ? (
                            <>
                              <div className="flex items-center gap-1 text-gray-700">
                                <FaHome className="w-3 h-3 text-gray-400" />
                                {t('manage_users_total_nights')}: {presence.get('totalNights') || 0}
                              </div>
                              <div className="flex items-center gap-1 text-gray-700">
                                <FaCheckCircle className="w-3 h-3 text-gray-400" />
                                {t('manage_users_total_bookings')}: {presence.get('totalBookings') || 0}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">{t('manage_users_no_presence_data')}</span>
                          )}
                          {tokenBalance > 0 && (
                            <div className="flex items-center gap-1 text-purple-700">
                              <span className="font-medium">
                                {parseFloat(tokenBalance || 0).toFixed(2)} $TDF
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-500 font-medium">{t('manage_users_vouches')}</span>
                          {vouches && vouches.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {vouches.map((vouch: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1 text-green-700">
                                  <FaUserCheck className="w-3 h-3 text-green-500" />
                                  {vouch.vouchedBy} ({dayjs(vouch.vouchedAt).format('MMM YYYY')})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">{t('manage_users_no_vouches')}</span>
                          )}
                        </div>

                        {user.get('citizenship') && (
                          <div className="sm:col-span-3 flex flex-col gap-1.5 pt-2 border-t border-gray-100">
                            <span className="text-gray-500 font-medium">{t('manage_users_citizenship')}</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {user.getIn(['citizenship', 'status']) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 text-[10px]">{t('manage_users_citizenship_status')}</span>
                                  <span className={`font-medium ${
                                    user.getIn(['citizenship', 'status']) === 'completed' ? 'text-green-600' :
                                    user.getIn(['citizenship', 'status']) === 'pending-payment' ? 'text-yellow-600' :
                                    user.getIn(['citizenship', 'status']) === 'cancelled' ? 'text-red-600' : 'text-gray-700'
                                  }`}>
                                    {user.getIn(['citizenship', 'status'])}
                                  </span>
                                </div>
                              )}
                              {user.getIn(['citizenship', 'appliedAt']) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 text-[10px]">{t('manage_users_citizenship_applied')}</span>
                                  <span className="text-gray-700">{dayjs(user.getIn(['citizenship', 'appliedAt'])).format('MMM D, YYYY')}</span>
                                </div>
                              )}
                              {user.getIn(['citizenship', 'tokensToFinance']) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 text-[10px]">{t('manage_users_citizenship_tokens_financed')}</span>
                                  <span className="text-gray-700">{user.getIn(['citizenship', 'tokensToFinance'])} TDF</span>
                                </div>
                              )}
                              {user.getIn(['citizenship', 'totalToPayInFiat']) && (
                                <div className="flex flex-col">
                                  <span className="text-gray-400 text-[10px]">{t('manage_users_citizenship_total_to_pay')}</span>
                                  <span className="text-gray-700">€{user.getIn(['citizenship', 'totalToPayInFiat'])}</span>
                                </div>
                              )}
                            </div>
                            {user.getIn(['citizenship', 'why']) && (
                              <div className="flex flex-col mt-1">
                                <span className="text-gray-400 text-[10px]">{t('manage_users_citizenship_why')}</span>
                                <span className="text-gray-700 italic">&ldquo;{user.getIn(['citizenship', 'why'])}&rdquo;</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="sm:col-span-3 flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                          <span className="text-gray-500 font-medium mr-2">{t('manage_users_all_roles')}:</span>
                          {user.get('roles').map((role: string) => (
                            <div
                              key={role}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex items-center gap-1"
                            >
                              {role}
                              <button
                                onClick={() => handleRemoveRole(role, user)}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
        </>
      )}
      <div className="my-10">
        <Pagination
          loadPage={(page: number) => {
            setPage(page);
          }}
          page={page}
          limit={USERS_PER_PAGE}
          total={totalUsers}
        />
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => handleAction('Export all')}
          className="w-auto"
          variant="secondary"
        >
          {t('manage_users_save_all')}
        </Button>
      </div>
    </section>
  );
};

export default UsersList;
