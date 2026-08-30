import { useState } from 'react';

import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { Button } from '../ui';

const DeleteAccountSection = () => {
  const t = useTranslations() as (key: string) => string;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'delete') {
      setError('Please type "delete" to confirm account deletion');
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete('/account');

      // Remove all cookies
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      // Log out user by clearing localStorage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home page after successful deletion
      window.location.href = '/';
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  // The caller supplies the card around this — it is a section of the Account
  // page rather than a page of its own.
  return (
    <div>
      {!showConfirmation ? (
        <div>
          <p className="mb-4 text-gray-600">
            {t('settings_delete_account_warning')}
          </p>
          <Button
            onClick={() => setShowConfirmation(true)}
            variant="secondary"
            size="small"
            isFullWidth={false}
          >
            {t('settings_delete_account_button')}
          </Button>
        </div>
      ) : (
        <div className="border border-red-300 rounded-md p-4 bg-red-50">
          <h4 className="font-bold text-red-700 mb-2">
            {t('settings_delete_account')}
          </h4>
          <p className="mb-4 text-red-700">
            {t('settings_delete_account_action_warning')}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-red-700">
              {t('settings_delete_account_type_to_confirm')}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleDeleteAccount}
              isEnabled={!isDeleting}
              size="small"
              isFullWidth={false}
              className="bg-red-600 border-red-700 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? t('settings_deleting')
                : t('settings_delete_account_confirm_button')}
            </Button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText('');
                setError(null);
              }}
              className="text-sm underline text-red-700"
            >
              {t('settings_cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountSection;
