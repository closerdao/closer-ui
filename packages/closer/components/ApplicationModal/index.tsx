import { useRouter } from 'next/router';

import React, { useContext, useEffect, useMemo, useState } from 'react';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { ApplicationField, ApplicationsConfig } from '../../types/api';
import api from '../../utils/api';
import { saveApplicationAnswers } from '../../utils/applicationAnswersStorage';
import { parseMessageFromError } from '../../utils/common';
import { PromptGetInTouchContext } from '../PromptGetInTouchContext';
import type { PromptGetInTouchContextType } from '../PromptGetInTouchContext';
import { Button, Heading, Input, Textarea } from '../ui';
import Dropdown from '../ui/Select/Dropdown';

/** Answers for these keys are columns on the application model, not `fields`. */
const TOP_LEVEL_FIELDS = ['name', 'email', 'phone'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CountryOption {
  value: string;
  label: string;
}

/** `options` is authored as a comma separated list in the admin config. */
const parseOptions = (options?: string): CountryOption[] =>
  (options || '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => ({ value: option, label: option }));

const isFieldConfigured = (field: unknown): field is ApplicationField =>
  Boolean(
    field &&
      typeof field === 'object' &&
      typeof (field as ApplicationField).name === 'string' &&
      (field as ApplicationField).name.trim(),
  );

const NextStep = ({
  status,
  label,
  hint,
}: {
  status: 'done' | 'active' | 'pending';
  label: string;
  hint?: string;
}) => (
  <li
    className={`flex gap-3 items-start ${
      status === 'pending' ? 'opacity-50' : ''
    }`}
  >
    <span
      className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
        status === 'done'
          ? 'bg-accent text-white'
          : 'bg-accent-light text-accent'
      }`}
    >
      {status === 'done' ? <Check className="w-3.5 h-3.5" /> : '●'}
    </span>
    <span className="flex flex-col">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-xs opacity-70 mt-0.5">{hint}</span>}
    </span>
  </li>
);

/**
 * Config driven "apply to join" modal. The fields come from the `applications`
 * config, so each platform asks its own questions — see `configDescription` in
 * `config.ts`. Opened through `PromptGetInTouchContext`, which the primary CTA
 * in the navigation toggles.
 */
const ApplicationModal = () => {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const config = useConfig() || {};
  const applicationsConfig = (config.applications || {}) as ApplicationsConfig;

  const { isOpen, setIsOpen } = useContext(
    PromptGetInTouchContext,
  ) as PromptGetInTouchContextType;

  const fields = useMemo(
    () => (applicationsConfig.fields || []).filter(isFieldConfigured),
    [applicationsConfig.fields],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentApplication, setHasSentApplication] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryError, setCountryError] = useState<string | null>(null);

  const hasCountryField = fields.some((field) => field.type === 'country');

  useEffect(() => {
    if (!isOpen || !hasCountryField || countries.length > 0) {
      return;
    }
    const getCountries = async () => {
      try {
        setCountryError(null);
        const res = await api.get('/meta/countries');
        setCountries(
          res.data.results.map((country: any) => ({
            label: country.name,
            value: country.name,
          })),
        );
      } catch (error) {
        setCountryError(parseMessageFromError(error));
      }
    };
    getCountries();
  }, [isOpen, hasCountryField, countries.length]);

  const setAnswer = (name: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = (answers[field.name] || '').trim();
      if (field.required && !value) {
        errors[field.name] = t('application_modal_error_required');
        return;
      }
      if (value && field.type === 'email' && !EMAIL_PATTERN.test(value)) {
        errors[field.name] = t('application_modal_error_email');
      }
      if (value && field.type === 'number' && isNaN(Number(value))) {
        errors[field.name] = t('application_modal_error_number');
      }
    });
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      const payload: Record<string, unknown> = {};
      const extraFields: Record<string, string> = {};

      fields.forEach((field) => {
        const value = (answers[field.name] || '').trim();
        if (!value) return;
        if (TOP_LEVEL_FIELDS.includes(field.name)) {
          payload[field.name] = value;
        } else {
          extraFields[field.name] = value;
        }
      });

      const { data } = await api.post('/application', {
        ...payload,
        fields: extraFields,
        ...(referredBy && { referredBy }),
      });

      // /village/launch pre-fills the village form from these answers once the
      // applicant has an account and a subscription. The created application's
      // id rides along so the village can link back to it.
      const createdApplication = data?.results || data;
      saveApplicationAnswers({
        ...(typeof createdApplication?._id === 'string'
          ? { _id: createdApplication._id }
          : {}),
        ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
        ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
        ...(typeof payload.phone === 'string' ? { phone: payload.phone } : {}),
        fields: extraFields,
      });

      // SignupForm pre-fills from this key, so the account step of the
      // next-steps flow starts with the email the applicant just typed.
      if (typeof payload.email === 'string') {
        localStorage.setItem('email', payload.email);
      }

      setHasSentApplication(true);
    } catch (error) {
      setSubmitError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !applicationsConfig.enabled || fields.length === 0) {
    return null;
  }

  const renderField = (field: ApplicationField) => {
    const value = answers[field.name] || '';
    const label = field.label || field.name;

    if (field.type === 'select' || field.type === 'country') {
      const options =
        field.type === 'country' ? countries : parseOptions(field.options);
      return (
        <Dropdown
          id={field.name}
          label={label}
          value={value}
          options={options}
          onChange={(option: string) => setAnswer(field.name, option)}
          placeholder={field.placeholder || label}
          isRequired={field.required}
          className="h-10"
        />
      );
    }

    if (field.type === 'longtext') {
      return (
        <>
          <label className="font-medium" htmlFor={field.name}>
            {label}
          </label>
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => setAnswer(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </>
      );
    }

    const inputType =
      field.type === 'number' || field.type === 'date' ? field.type : 'text';

    return (
      <Input
        id={field.name}
        label={label}
        type={inputType}
        value={value}
        onChange={(e) => setAnswer(field.name, e.target.value)}
        placeholder={field.placeholder || ''}
        isRequired={field.required}
      />
    );
  };

  return (
    <div className="fixed bg-black/60 backdrop-blur-sm inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="relative bg-dominant z-[101] rounded-2xl shadow-2xl max-w-md w-full my-auto">
        <button
          onClick={() => setIsOpen(false)}
          aria-label={t('application_modal_close')}
          className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent-light transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 py-9 flex flex-col">
          {hasSentApplication ? (
            <div className="py-2">
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-5 text-2xl">
                  🌱
                </div>
                <Heading level={3} className="mb-2">
                  {applicationsConfig.successTitle ||
                    t('application_modal_success_title')}
                </Heading>
                <p className="text-sm">
                  {applicationsConfig.successMessage ||
                    t('application_modal_success_message')}
                </p>
              </div>

              <span className="block text-xs font-bold uppercase tracking-[0.22em] text-accent mb-4">
                {t('application_modal_next_steps_title')}
              </span>
              <ol className="flex flex-col gap-4 mb-7">
                <NextStep
                  status="done"
                  label={t('application_modal_step_received')}
                />
                <NextStep
                  status={isAuthenticated ? 'done' : 'active'}
                  label={
                    isAuthenticated
                      ? t('application_modal_step_account_done')
                      : t('application_modal_step_account')
                  }
                  hint={
                    isAuthenticated
                      ? undefined
                      : t('application_modal_step_account_hint')
                  }
                />
                <NextStep
                  status={isAuthenticated ? 'active' : 'pending'}
                  label={t('application_modal_step_subscribe')}
                  hint={t('application_modal_step_subscribe_hint')}
                />
              </ol>

              <Button
                variant="primary"
                onClick={() => {
                  setIsOpen(false);
                  router.push(
                    isAuthenticated
                      ? '/subscriptions'
                      : `/signup?back=${encodeURIComponent('/subscriptions')}`,
                  );
                }}
              >
                {isAuthenticated
                  ? t('application_modal_cta_subscribe')
                  : t('application_modal_cta_create_account')}
              </Button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm underline mt-4 mx-auto opacity-70 hover:opacity-100"
              >
                {t('application_modal_cta_later')}
              </button>
            </div>
          ) : (
            <>
              {applicationsConfig.eyebrow && (
                <span className="block text-xs font-bold uppercase tracking-[0.22em] text-accent mb-3">
                  {applicationsConfig.eyebrow}
                </span>
              )}
              <Heading level={3} className="mb-2">
                {applicationsConfig.title || t('application_modal_title')}
              </Heading>
              {applicationsConfig.description && (
                <p className="text-sm mb-6">{applicationsConfig.description}</p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1">
                    {renderField(field)}
                    {fieldErrors[field.name] && (
                      <div className="text-red-600 text-sm">
                        {fieldErrors[field.name]}
                      </div>
                    )}
                    {field.type === 'country' && countryError && (
                      <div className="text-red-600 text-sm">{countryError}</div>
                    )}
                  </div>
                ))}

                {submitError && (
                  <div
                    className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                    role="alert"
                  >
                    {submitError}
                  </div>
                )}

                <Button type="submit" variant="primary" isLoading={isLoading}>
                  {applicationsConfig.submitButtonText ||
                    t('application_modal_submit')}
                </Button>
                {applicationsConfig.disclaimer && (
                  <p className="text-xs text-center">
                    {applicationsConfig.disclaimer}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
