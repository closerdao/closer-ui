import { useEffect, useState } from 'react';

import { AlertTriangle, BadgeCheck, CreditCard, Key } from 'lucide-react';

import { useTranslations } from 'next-intl';

import {
  DeleteAccountSection,
  SettingsLayout,
} from '../../components/Settings';
import { Button } from '../../components/ui';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';

import { useSettingsUser } from '../../hooks/useSettingsUser';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import PageNotFound from '../not-found';

/** Shown beside a contact field the backend has confirmed. */
const VerifiedBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
    <BadgeCheck className="w-3 h-3" />
    {label}
  </span>
);

const AccountSettingsPage = () => {
  const t = useTranslations() as (key: string) => string;

  const {
    user,
    isAuthenticated,
    error,
    setError,
    hasSaved,
    setHasSaved,
    saveUserData,
  } = useSettingsUser();

  const [updatePhone, toggleUpdatePhone] = useState<boolean | null>(null);
  const [updateEmail, toggleUpdateEmail] = useState<boolean | null>(null);
  const [phoneSaved, setPhoneSaved] = useState<boolean | null>(null);
  const [emailSaved, setEmailSaved] = useState<boolean | null>(null);
  const [emailSaving, setEmailSaving] = useState<boolean | null>(null);
  const [phoneSaving, setPhoneSaving] = useState<boolean | null>(null);
  /*
   * The field being edited lives in its own draft rather than on `user`:
   * `useSettingsUser` refetches the account after every autosave, and writing
   * the half-typed address onto the user meant that response wiped it.
   */
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [countries, setCountries] = useState<
    Array<{ label: string; value: string }>
  >([]);

  useEffect(() => {
    const getCountries = async () => {
      const countryList: Array<{ label: string; value: string }> = [];
      try {
        const res = await api.get('/meta/countries');
        res.data.results.forEach((country: { name: string; code: string }) => {
          countryList.push({ label: country.name, value: country.code });
        });
        setCountries(countryList);
      } catch (err) {
        console.error('[AccountSettingsPage] Error fetching countries:', err);
      }
    };
    getCountries();
  }, []);

  const savePhone = async (phone: string) => {
    setPhoneSaving(true);
    try {
      setPhoneSaved(false);
      await api.post('/auth/phone/update', { phone });
      setError(null);
      setPhoneSaved(true);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setPhoneSaving(false);
    }
  };

  const saveEmail = async (email: string) => {
    setEmailSaving(true);
    try {
      setEmailSaved(false);
      await api.post('/auth/email/update', { email });
      setError(null);
      setEmailSaved(true);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setEmailSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound
        back="/settings/account"
        error="Please log in to see this page."
      />
    );
  }

  return (
    <SettingsLayout
      activeTab="account"
      pageTitle={`${user.screenname} | ${t('settings_page_title')}`}
      error={error}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_account_information')}
          </h3>
        </div>

        <Input
          label={t('settings_name')}
          placeholder={t('settings_your_name')}
          value={user.screenname}
          onChange={saveUserData('screenname') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <div className="mb-6">
          <Input
            label={t('settings_email')}
            labelBadge={
              user.email_verified && !updateEmail ? (
                <VerifiedBadge label={t('settings_verified')} />
              ) : undefined
            }
            value={updateEmail ? emailDraft : user.email || ''}
            isDisabled={!updateEmail}
            onChange={(e) => setEmailDraft(e.target.value)}
            successMessage={
              emailSaved ? t('settings_email_confirm_message') : undefined
            }
            validation="email"
            className="mb-2"
          />
          <div>
            {updateEmail && !emailSaved ? (
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => saveEmail(emailDraft)}
                  isEnabled={!emailSaving}
                  variant="inline"
                >
                  {emailSaving
                    ? t('settings_verifying')
                    : t('settings_verify_email')}
                </Button>
                <Button
                  onClick={() => toggleUpdateEmail(false)}
                  variant="inline"
                >
                  {t('settings_cancel')}
                </Button>
              </div>
            ) : (
              !emailSaved && (
                <Button
                  onClick={() => {
                    setEmailDraft(user.email || '');
                    toggleUpdateEmail(!updateEmail);
                  }}
                  variant="inline"
                  className="mt-2"
                >
                  {t('settings_edit_email')}
                </Button>
              )
            )}
          </div>
        </div>

        <div>
          <Input
            label={t('settings_phone')}
            labelBadge={
              user.phone_verified && !updatePhone ? (
                <VerifiedBadge label={t('settings_verified')} />
              ) : undefined
            }
            isDisabled={!updatePhone}
            value={updatePhone ? phoneDraft : user.phone || ''}
            onChange={(e) => setPhoneDraft(e.target.value)}
            successMessage={
              phoneSaved ? t('settings_phone_confirm_message') : undefined
            }
            validation="phone"
            className="mb-2"
          />
          <div>
            {updatePhone && !phoneSaved ? (
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => savePhone(phoneDraft)}
                  isEnabled={!phoneSaving}
                  variant="inline"
                >
                  {phoneSaving
                    ? t('settings_verifying')
                    : t('settings_verify_phone')}
                </Button>
                <Button
                  onClick={() => toggleUpdatePhone(false)}
                  variant="inline"
                >
                  {t('settings_cancel')}
                </Button>
              </div>
            ) : (
              !phoneSaved && (
                <Button
                  onClick={() => {
                    setPhoneDraft(user.phone || '');
                    toggleUpdatePhone(!updatePhone);
                  }}
                  variant="inline"
                  className="mt-2"
                >
                  {t('settings_edit_phone')}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_billing_information')}
          </h3>
        </div>

        <Input
          label={t('settings_legal_name')}
          placeholder={t('settings_legal_name_placeholder')}
          value={user?.kycData?.legalName || ''}
          onChange={saveUserData('legalName') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Input
          label={t('settings_billing_address')}
          placeholder={t('settings_billing_address_placeholder')}
          value={user?.kycData?.address1 || ''}
          onChange={saveUserData('address1') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Select
          label={t('settings_country')}
          value={user?.kycData?.country || ''}
          options={countries}
          className="mb-4"
          onChange={(value: string) => saveUserData('country')(value)}
          isRequired
        />

        <Input
          label={t('settings_city')}
          placeholder={t('settings_city_placeholder')}
          value={user?.kycData?.city || ''}
          onChange={saveUserData('city') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Input
          label={t('settings_postal_code')}
          placeholder={t('settings_postal_code_placeholder')}
          value={user?.kycData?.postalCode || ''}
          onChange={saveUserData('postalCode') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Input
          label={t('settings_tax_number')}
          placeholder={t('settings_tax_number_placeholder')}
          value={user?.kycData?.TIN || ''}
          onChange={saveUserData('TIN') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
      </div>

      {/* Deleting the account is an account action, so it lives at the bottom
          of this page rather than in a section of its own. */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-medium text-red-600">
            {t('settings_delete_account')}
          </h3>
        </div>
        <DeleteAccountSection />
      </div>
    </SettingsLayout>
  );
};

export default AccountSettingsPage;
