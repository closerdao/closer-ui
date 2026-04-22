import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../contexts/platform';
import api, { formatSearch } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import Modal from '../Modal';

export interface CohousingAddParticipantUser {
  _id: string;
  screenname: string;
  email?: string;
  walletAddress?: string;
}

const getCreatedApplicationId = (
  out: { results?: unknown } | null | undefined,
): string => {
  if (!out?.results) {
    return '';
  }
  const doc = out.results;
  if (
    doc &&
    typeof (doc as { toJS?: () => { _id: string } }).toJS === 'function'
  ) {
    const plain = (doc as { toJS: () => { _id?: string } }).toJS();
    return typeof plain?._id === 'string' ? plain._id : '';
  }
  if (doc && typeof doc === 'object' && doc !== null && '_id' in doc) {
    return String((doc as { _id: string })._id);
  }
  return '';
};

const UserSearchForParticipant = ({
  selectedUser,
  onSelect,
  onClear,
}: {
  selectedUser: CohousingAddParticipantUser | null;
  onSelect: (user: CohousingAddParticipantUser) => void;
  onClear: () => void;
}) => {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CohousingAddParticipantUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const params = {
        where: formatSearch({ _search: query }),
        sort_by: '-created',
        limit: 10,
      };
      const { data } = await api.get('/user', { params });
      setResults((data.results || []) as CohousingAddParticipantUser[]);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsOpen(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => void fetchUsers(value), 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedUser.screenname}
          </p>
          {selectedUser.email && (
            <p className="text-xs text-gray-500 truncate">
              {selectedUser.email}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-gray-500 hover:text-gray-800 text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => search.length >= 2 && setIsOpen(true)}
        placeholder={t(
          'cohousing_app_admin_add_participant_search_placeholder',
        )}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        autoComplete="off"
      />
      {isOpen && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {t('cohousing_app_admin_add_participant_search_loading')}
            </div>
          )}
          {!isLoading && results.length === 0 && search.length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {t('cohousing_app_admin_add_participant_search_empty')}
            </div>
          )}
          {results.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => {
                onSelect(u);
                setSearch('');
                setIsOpen(false);
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium text-gray-900">
                {u.screenname}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {u.email
                  ? u.email
                  : u.walletAddress
                  ? `${u.walletAddress.slice(0, 6)}…${u.walletAddress.slice(
                      -4,
                    )}`
                  : t('cohousing_app_admin_add_participant_no_contact')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export interface CohousingAddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (applicationId: string) => void;
  existingApplicantUserIds: Set<string>;
}

const CohousingAddParticipantModal = ({
  isOpen,
  onClose,
  onCreated,
  existingApplicantUserIds,
}: CohousingAddParticipantModalProps) => {
  const t = useTranslations();
  const { platform } = usePlatform() as {
    platform: {
      cohousingapplication: { create: (d: unknown) => Promise<unknown> };
    };
  };
  const [selectedUser, setSelectedUser] =
    useState<CohousingAddParticipantUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUser(null);
      setFormError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isAlreadyApplicant = Boolean(
    selectedUser && existingApplicantUserIds.has(selectedUser._id),
  );

  const handleConfirm = async () => {
    if (!selectedUser || isAlreadyApplicant) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const out = (await platform.cohousingapplication.create({
        isDraft: false,
        status: 'active',
        currentStep: 1,
        source: 'admin',
        createdBy: selectedUser._id,
        intake: {
          fullName: selectedUser.screenname,
          email: selectedUser.email?.trim() || '',
        },
      })) as { results?: unknown };
      const newId = getCreatedApplicationId(out);
      if (!newId) {
        setFormError(t('cohousing_intake_error_generic'));
        return;
      }
      onCreated(newId);
      onClose();
    } catch (err: unknown) {
      setFormError(parseMessageFromError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      closeModal={() => {
        onClose();
      }}
      className="md:max-w-lg"
    >
      <div className="flex flex-col gap-4 pt-1">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 pr-8">
            {t('cohousing_app_admin_add_participant_modal_title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('cohousing_app_admin_add_participant_modal_subtitle')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('cohousing_app_admin_add_participant_label')}
          </p>
          <UserSearchForParticipant
            selectedUser={selectedUser}
            onSelect={setSelectedUser}
            onClear={() => setSelectedUser(null)}
          />
          <p className="text-xs text-gray-500">
            {t('cohousing_app_admin_add_participant_search_hint')}
          </p>
        </div>
        {isAlreadyApplicant && (
          <p className="text-sm text-red-600">
            {t('cohousing_app_admin_add_participant_already_in_flow')}
          </p>
        )}
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 disabled:opacity-50"
          >
            {t('cohousing_app_admin_add_participant_cancel')}
          </button>
          <button
            type="button"
            disabled={!selectedUser || isAlreadyApplicant || submitting}
            onClick={() => void handleConfirm()}
            className="px-3.5 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cohousing_app_admin_add_participant_confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CohousingAddParticipantModal;
