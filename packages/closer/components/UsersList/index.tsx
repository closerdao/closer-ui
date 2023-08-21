import Image from 'next/image';
import Link from 'next/link';

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { ACTIONS, USER_ROLE_OPTIONS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import api, { cdn } from '../../utils/api';
import { __, prepareUserDataForCsvExport } from '../../utils/helpers';
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
}

const UsersList = ({ where, page, setPage, sortBy }: Props) => {
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
  const [action, setAction] = useState<string | null>(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [creditsToSend, setCreditsToSend] = useState(1);
  const [reasonToSendCredits, setReasonToSendCredits] = useState('');
  const [error, setError] = useState<any>();
  const [success, setSuccess] = useState(false);
  const [csvData, setCsvData] = useState<any>(null);
  const [usersEmails, setUsersEmails] = useState<any[]>([]);

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
        setCsvData(prepareUserDataForCsvExport([...selectedUsers]));
        break;
      case 'Export all':
        const data = await getAllUserData();
        setCsvData(prepareUserDataForCsvExport([...data.results.toArray()]));
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
    <section className="flex gap-2 flex-col">
      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          {action === 'Add role' && (
            <div className="flex flex-col gap-4">
              <Heading level={4}>{__('manage_users_add_role')}</Heading>
              <div className="font-bold">
                {selectedUsers
                  .map((user) => {
                    return `${user.get('screenname')}`;
                  })
                  .join(', ')}
              </div>
              <Select
                className="rounded-full text-accent border-accent "
                value={__('manage_users_add_role_button')}
                options={USER_ROLE_OPTIONS.slice(1)}
                onChange={(value: string) => handleAddRole(value)}
                isRequired
                placeholder={__('manage_users_add_role_button')}
              />
              {success && (
                <div className="text-success text-center">
                  {__('manage_users_role_added')}
                </div>
              )}
            </div>
          )}
          {action === 'Remove role' && (
            <div className="flex flex-col gap-4">
              <Heading level={4}>{__('manage_users_remove_role')}</Heading>
              <div className="font-bold">
                {selectedUsers
                  .map((user) => {
                    return `${user.get('screenname')}`;
                  })
                  .join(', ')}
              </div>
              <Select
                className="rounded-full text-accent border-accent "
                value={__('manage_users_remove_role')}
                options={USER_ROLE_OPTIONS.slice(1)}
                onChange={(value: string) => handleRemoveRole(value)}
                isRequired
                placeholder={__('manage_users_remove_role')}
              />
              {success && (
                <div className="text-success text-center">
                  {__('manage_users_role_removed')}
                </div>
              )}
            </div>
          )}
          {action === 'Send carrots' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{__('manage_users_send_credits')}</Heading>

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
                placeholder={__('manage_users_reason_to_send_credits')}
              />
              <div className="flex space-between items-center">
                <p className="flex-1">{__('manage_users_how_many_credits')}</p>
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
                {__('manage_users_send_credits_button')}
              </Button>

              {success && (
                <div className="text-success text-center">
                  {__('manage_users_credits_sent')}
                </div>
              )}
            </div>
          )}

          {action === 'Export selected (CSV)' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{__('manage_users_export')}</Heading>

              {csvData && (
                <CSVLink
                  className="bg-accent rounded-full w-full py-3 text-center px-4 text-white uppercase"
                  data={csvData.data}
                  headers={csvData.headers}
                  filename="data.csv"
                >
                  {__('manage_users_save_button')}
                </CSVLink>
              )}
            </div>
          )}
          {action === 'Export all' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{__('manage_users_export_all')}</Heading>

              {csvData ? (
                <CSVLink
                  className="bg-accent rounded-full w-full py-3 text-center px-4 text-white uppercase"
                  data={csvData.data}
                  headers={csvData.headers}
                  filename="data.csv"
                >
                  {__('manage_users_save_button')}
                </CSVLink>
              ) : (
                <>{__('manage_users_preparing_data')}</>
              )}
            </div>
          )}

          {action === 'Copy emails' && (
            <div className="font-bold">{__('manage_users_emails_copied')}</div>
          )}

          {action === 'Unlink wallet' && (
            <div className="flex flex-col gap-6">
              <Heading level={4}>{__('admin_unlink_wallet')}</Heading>
              <div className="flex flex-col gap-6 my-4">
                <Heading level={3}>
                  {__('admin_unlink_wallet_disclaimer')}
                </Heading>

                <div className="font-bold">
                  {selectedUsers
                    .map((user) => {
                      return `${user.get('email')}`;
                    })
                    .join(', ')}
                </div>

                <Button onClick={handleUnlinkUserWallet}>
                  {__('admin_unlink_wallet_button')}
                </Button>
              </div>
              {error && <ErrorMessage error={error} />}
              {success && (
                <div className="text-success text-center">
                  {__('admin_unlink_wallet_success')}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {isLoading ? (
        <div className="my-16 flex items-center gap-2">
          <Spinner /> {__('generic_loading')}
        </div>
      ) : (
        <>
          <Heading level={2} className="border-b pb-2">
            {totalUsers ? totalUsers.toString() : 0}{' '}
            {totalUsers === 1
              ? __('manage_users_user')
              : __('manage_users_users')}
          </Heading>

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
                {__('manage_users_select_all')}
              </label>
            </div>

            <div className="w-[300px] flex gap-2 flex-col sm:flex-row">
              <div className="w-1/3 whitespace-nowrap font-bold  flex justify-start sm:justify-end items-center">
                {selectedUsers.length && selectedUsers.length}{' '}
                {__('manage_users_selected')}
              </div>
              <div className="w-2/3">
                <Select
                  className="rounded-full text-accent border-accent uppercase"
                  value={__('manage_users_actions')}
                  options={ACTIONS}
                  onChange={(action: string) => handleAction(action)}
                  isRequired
                  placeholder={__('manage_users_actions')}
                  isDisabled={Boolean(!selectedUsers.length)}
                />
              </div>
            </div>
          </div>

          {filteredUsers &&
            filteredUsers.map((row: any) => {
              const user = platform.user.findOne(row.get('_id'));
              return (
                <Card
                  className={`py-3 sm:py-1 text-sm ${
                    selectedUsers.some(
                      (selectedUser) =>
                        selectedUser.get('_id') === user.get('_id'),
                    ) && 'bg-accent-light'
                  }`}
                  key={user.get('email')}
                >
                  <div className="flex items-center gap-4 sm:gap-2 justify-between flex-col sm:flex-row">
                    <div className="w-full sm:w-[50%] flex gap-2 items-center flex-wrap">
                      <div className="flex items-center">
                        <div>
                          <Checkbox
                            isChecked={selectedUsers.some(
                              (selectedUser) =>
                                selectedUser.get('_id') === user.get('_id'),
                            )}
                            onChange={() => handleUserSelect(user)}
                          />
                        </div>
                        <div>
                          {user.get('photo') ? (
                            <Image
                              src={`${cdn}${user.get('photo')}-profile-sm.jpg`}
                              alt={user.get('screenname')}
                              width={30}
                              height={30}
                              className="rounded-full"
                            />
                          ) : (
                            <FaUser className="text-success w-[30px] h-[30px] rounded-full" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div>
                            <Link
                              className="hover:bg-accent rounded-md px-1 hover:text-white"
                              href={`/members/${user.get('slug')}`}
                            >
                              {user.get('screenname')}
                            </Link>
                          </div>
                          <div className="text-xs px-1">
                            {dayjs(new Date()).from(user.get('created'), true)}
                          </div>
                        </div>
                      </div>

                      <div>
                        {user.get('roles').includes('member') ? (
                          <div className="bg-white flex border px-2 py-1 gap-1 border-accent rounded-md">
                            <Image
                              src={'/images/admin/icon-sheep.png'}
                              alt={'member'}
                              width={18}
                              height={17}
                              className="rounded-full"
                            />
                            {__('manage_users_role_member')}
                            <Button
                              onClick={() => handleRemoveRole('member', user)}
                              className="p-0 min-h-min bg-white border-none text-black"
                            >
                              <svg
                                viewBox="0 0 12 12"
                                version="1.1"
                                className="w-2.5 h-2.5 stroke-accent"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <line
                                  x1="1"
                                  y1="11"
                                  x2="11"
                                  y2="1"
                                  strokeWidth="2"
                                />
                                <line
                                  x1="1"
                                  y1="1"
                                  x2="11"
                                  y2="11"
                                  strokeWidth="2"
                                />
                              </svg>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <div>
                        {user.get('subscription').get('plan') ? (
                          <div className="bg-white flex border px-2 py-1 border-gray-500 rounded-md gap-1">
                            <Image
                              src={`/images/admin/icon-${user
                                .get('subscription')
                                .get('plan')}.png`}
                              alt={user.get('subscription').get('plan')}
                              width={20}
                              height={20}
                            />
                            {user
                              .get('subscription')
                              .get('plan')
                              .slice(0, 1)
                              .toUpperCase() +
                              user.get('subscription').get('plan').slice(1)}
                          </div>
                        ) : (
                          <div className="bg-white flex border px-3 py-1 border-gray-500 rounded-md gap-1">
                            <Image
                              src={'/images/admin/icon-explorer.png'}
                              alt={'member'}
                              width={20}
                              height={20}
                            />
                            {__('manage_users_subscription_explorer')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full sm:w-[50%] flex-col sm:flex-row flex gap-1 justify-end flex-wrap">
                      <div className="flex gap-1 flex-wrap justify-start sm:justify-end">
                        {user.get('roles').map((role: string) => {
                          if (role !== 'member') {
                            return (
                              <div
                                key={role}
                                className=" py-[3px] text-xs bg-accent text-white rounded-full pl-4 pr-2 flex gap-[2px]"
                              >
                                <div className="whitespace-nowrap pt-[7px] pb-[8px]">
                                  {role}
                                </div>
                                <Button
                                  onClick={() => handleRemoveRole(role, user)}
                                  className="p-0 min-h-min"
                                >
                                  <svg
                                    viewBox="0 0 12 12"
                                    version="1.1"
                                    className="w-2.5 h-2.5 fill-current "
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <line
                                      x1="1"
                                      y1="11"
                                      x2="11"
                                      y2="1"
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                    <line
                                      x1="1"
                                      y1="1"
                                      x2="11"
                                      y2="11"
                                      stroke="white"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            );
                          }
                        })}
                      </div>

                      <div>
                        <Select
                          className="rounded-full text-accent border-accent"
                          value={__('manage_users_add_role_button')}
                          options={USER_ROLE_OPTIONS.slice(1)}
                          onChange={(value: string) =>
                            handleAddRole(value, user)
                          }
                          isRequired
                          placeholder={__('manage_users_add_role_button')}
                        />
                      </div>
                    </div>
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
          type="secondary"
        >
          {__('manage_users_save_all')}
        </Button>
      </div>
    </section>
  );
};

export default UsersList;
