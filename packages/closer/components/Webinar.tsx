import { useRouter } from 'next/router';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import api from '../utils/api';
import TurnstileWidget from './TurnstileWidget';
import { Button, ErrorMessage, Heading } from './ui';

dayjs.extend(utc);
dayjs.extend(timezone);

interface WebinarConfig {
  enabled?: boolean;
  isDayOfMonth?: boolean;
  dayOfMonth?: number;
  weekDay?: string;
  weekPosition?: string;
  time?: string;
  timezone?: string;
}

interface Props {
  id?: string;
  tags?: string[];
  analyticsCategory?: string;
}

const Webinar = ({ id, tags = ['webinar'], analyticsCategory = 'Webinar' }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [webinarConfig, setWebinarConfig] = useState<WebinarConfig | null>(null);

  useEffect(() => {
    const localEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('email') : null;
    if (localEmail) {
      setEmail(localEmail);
    }
  }, []);

  useEffect(() => {
    const fetchWebinarConfig = async () => {
      try {
        const res = await api.get('/config/webinar');
        setWebinarConfig(res?.data?.results?.value || null);
      } catch (err) {
        console.error('Error fetching webinar config:', err);
        setWebinarConfig(null);
      }
    };
    fetchWebinarConfig();
  }, []);

  const [generalTimezone, setGeneralTimezone] = useState<string>('Europe/Lisbon');

  useEffect(() => {
    const fetchGeneralConfig = async () => {
      try {
        const res = await api.get('/config/general');
        const tz = res?.data?.results?.value?.timezone;
        if (tz) setGeneralTimezone(tz);
      } catch (err) {
        console.error('Error fetching general config:', err);
      }
    };
    fetchGeneralConfig();
  }, []);

  const nextWebinarDate = useMemo(() => {
    if (!webinarConfig) return null;

    const timeZone = webinarConfig.timezone || generalTimezone;
    const timeStr = webinarConfig.time || '10:00';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10) || 10;
    const minutes = parseInt(minutesStr, 10) || 0;

    const now = dayjs().tz(timeZone);

    const createDateInTimezone = (year: number, month: number, day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      return dayjs.tz(dateStr, timeZone);
    };

    if (webinarConfig.isDayOfMonth) {
      const targetDay = webinarConfig.dayOfMonth || 1;
      let targetDate = createDateInTimezone(now.year(), now.month(), targetDay);

      if (targetDate.isBefore(now)) {
        const nextMonth = now.add(1, 'month');
        targetDate = createDateInTimezone(nextMonth.year(), nextMonth.month(), targetDay);
      }

      return targetDate;
    }

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekPositions = ['First', 'Second', 'Third', 'Fourth', 'Last'];

    const targetWeekDay = webinarConfig.weekDay || 'Monday';
    const targetPosition = webinarConfig.weekPosition || 'First';

    const targetDayIndex = weekDays.indexOf(targetWeekDay);
    const positionIndex = weekPositions.indexOf(targetPosition);

    const findWebinarDateInMonth = (year: number, month: number) => {
      let candidateDate = dayjs.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, timeZone).startOf('month');

      while (candidateDate.day() !== targetDayIndex) {
        candidateDate = candidateDate.add(1, 'day');
      }

      if (positionIndex === 4) {
        while (candidateDate.add(1, 'week').month() === candidateDate.month()) {
          candidateDate = candidateDate.add(1, 'week');
        }
      } else {
        candidateDate = candidateDate.add(positionIndex, 'week');
      }

      return createDateInTimezone(candidateDate.year(), candidateDate.month(), candidateDate.date());
    };

    let candidateDate = findWebinarDateInMonth(now.year(), now.month());

    if (candidateDate.isBefore(now)) {
      const nextMonth = now.add(1, 'month');
      candidateDate = findWebinarDateInMonth(nextMonth.year(), nextMonth.month());
    }

    return candidateDate;
  }, [webinarConfig, generalTimezone]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('webinar_error_fill_fields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('webinar_error_invalid_email'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await api.post('/webinar', {
        email,
        tags,
        turnstileToken,
      });

      if (process.env.NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE === 'true') {
        try {
          const referrer = typeof localStorage !== 'undefined' ? localStorage.getItem('referrer') : null;
          const subscribeTags = [
            ...tags,
            router.asPath,
            referrer ? `ref:${referrer}` : null,
          ].filter(Boolean);
          await api.post('/subscribe', {
            email,
            tags: subscribeTags,
          });
        } catch (subscribeError) {
          console.error('Error subscribing to newsletter:', subscribeError);
        }
      }

      setIsSuccess(true);
      localStorage.setItem('email', email);
      gaEvent('click', {
        category: analyticsCategory,
        label: 'webinar_signup',
      });
    } catch (err: any) {
      console.error('Error sending webinar invite:', err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        t('webinar_error_generic')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!webinarConfig?.enabled) {
    return null;
  }

  return (
    <section
      id={id}
      className="relative py-12 md:py-16 overflow-hidden"
    >
      <div 
        className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-[gradientShift_8s_ease-in-out_infinite]"
        style={{ backgroundSize: '200% 200%' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
      
      {nextWebinarDate && (
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-20 md:w-24">
            <div className="bg-pink-500 text-white text-center py-1 text-[10px] md:text-xs font-bold uppercase tracking-wide">
              {nextWebinarDate.local().format('MMM')}
            </div>
            <div className="bg-white text-center py-1.5 md:py-2">
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-none">
                {nextWebinarDate.local().format('D')}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 font-medium">
                {nextWebinarDate.local().format('ddd')}
              </p>
            </div>
            <div className="bg-gray-50 text-center py-1.5 border-t border-gray-100">
              <p className="text-[10px] md:text-xs font-semibold text-gray-700">
                {nextWebinarDate.local().format('h:mm A')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <p className="text-[10px] uppercase tracking-wider text-white/80 mb-2 font-medium">
          {t('webinar_section_label')}
        </p>
        <Heading display level={2} className="mb-3 text-2xl md:text-3xl font-normal text-white tracking-tight">
          {t('webinar_section_title')}
        </Heading>
        <p className="text-sm text-white/90 mb-6 leading-relaxed max-w-xl mx-auto font-light">
          {t('webinar_section_desc')}
        </p>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 md:p-6 shadow-2xl max-w-sm mx-auto">
          {isSuccess ? (
            <p className="text-green-600 text-sm font-medium text-center py-2">
              {t('webinar_success')}
            </p>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('webinar_form_email')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              {email.length > 0 && (
                <div className="animate-[fadeIn_0.3s_ease-in-out]">
                  <TurnstileWidget
                    action="webinar_signup"
                    onVerify={setTurnstileToken}
                  />
                </div>
              )}
              {error && <ErrorMessage error={error} />}
              <Button
                type="submit"
                isEnabled={!isLoading && !!turnstileToken}
                isLoading={isLoading}
                className="w-full"
              >
                {t('webinar_form_submit')}
              </Button>
              <p className="text-[10px] text-gray-500 text-center">
                {t('webinar_form_note')}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Webinar;
