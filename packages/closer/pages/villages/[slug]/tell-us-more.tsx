import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
  Eyebrow,
  PageShell,
  btnPrimary,
  btnSmall,
} from '../../../components/VillageUI';
import { ErrorMessage, Spinner } from '../../../components/ui';

import dayjs from 'dayjs';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { Village } from '../../../types/village';
import { getVillage } from '../../../utils/village.utils';
import {
  VillageQuestion,
  VillageQuestionsError,
  countAnsweredVillageQuestions,
  getVillageQuestions,
  saveVillageAnswers,
  villageAnswerChanges,
  villageAnswerDrafts,
} from '../../../utils/villageQuestions';
import PageNotFound from '../../not-found';

/**
 * The founder's side of lead enrichment: the open questions the nightly job
 * raised, asked directly rather than saved for the ambassador's next call.
 *
 * Access is the API's call, not this page's — `GET /village/:id/questions`
 * answers 401/403 for anyone who is not the village's creator, one of its
 * assigned ambassadors or a manager, and that is what sends the viewer to 401
 * here. The page never renders anything from the CRM side of the lead.
 */

/** Slightly longer than the CSS transition, so the row leaves only once the
    fold has actually finished drawing. */
const FOLD_MS = 560;

const Marker: FC<{ done?: boolean; children?: ReactNode }> = ({
  done,
  children,
}) => (
  <span
    className={`w-6 h-6 mt-0.5 shrink-0 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${
      done
        ? 'bg-accent text-accent-foreground border-accent'
        : 'bg-background text-foreground/50 border-neutral-dark'
    }`}
  >
    {done ? <Check className="w-3.5 h-3.5" /> : children}
  </span>
);

const QuestionCard: FC<{
  question: VillageQuestion;
  marker: ReactNode;
  draft: string;
  isDirty: boolean;
  isDisabled: boolean;
  onChange: (value: string) => void;
}> = ({ question, marker, draft, isDirty, isDisabled, onChange }) => {
  const t = useTranslations();
  const answeredAt = question.answeredAt ? dayjs(question.answeredAt) : null;

  return (
    <div
      className="rounded-[22px] border border-accent-medium bg-background p-6 md:p-7"
      data-testid="village-question"
    >
      <div className="flex items-start gap-3">
        {marker}
        <label
          className="font-serif text-xl text-foreground leading-snug"
          htmlFor={`village-question-${question.id}`}
        >
          {question.question}
        </label>
      </div>

      <textarea
        id={`village-question-${question.id}`}
        className="mt-4 w-full min-h-[110px] rounded-xl border border-neutral-dark bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
        value={draft}
        disabled={isDisabled}
        placeholder={t('villages_questions_answer_placeholder')}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 min-h-[18px]">
        {isDirty ? (
          <span className="text-[12.5px] font-semibold text-accent-text">
            {t('villages_questions_unsaved')}
          </span>
        ) : answeredAt?.isValid() ? (
          <span className="text-[12.5px] text-foreground/50">
            {t('villages_questions_answered_at', {
              when: answeredAt.format('D MMM YYYY'),
            })}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const VillageQuestionsPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const { isAuthenticated, isLoading: isLoadingUser } = useAuth();

  const [village, setVillage] = useState<Village | null>(null);
  const [questions, setQuestions] = useState<VillageQuestion[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  // Set by a save that actually told us something, and outlives the fold: a
  // thank-you that flashed past in half a second would not read as one.
  const [thanked, setThanked] = useState(false);
  // The ids on their way out: answered by the save that just landed, still
  // drawn so the card has something to fold.
  const [folding, setFolding] = useState<string[]>([]);
  const [showAnswered, setShowAnswered] = useState(false);
  const foldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const found = await getVillage(slug);
      if (cancelled) return;
      setVillage(found);
      if (!found) {
        setIsLoading(false);
        return;
      }
      try {
        // The questions route takes the id, not the slug the URL carries.
        const result = await getVillageQuestions(found._id);
        if (cancelled) return;
        setQuestions(result.questions);
        setDrafts(villageAnswerDrafts(result.questions));
      } catch (err) {
        if (cancelled) return;
        const status = err instanceof VillageQuestionsError ? err.status : 0;
        if (status === 401 || status === 403) {
          setIsForbidden(true);
        } else {
          setError(
            err instanceof Error ? err.message : t('villages_action_error'),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // A fold left running past unmount would set state on a dead component.
  useEffect(
    () => () => {
      if (foldTimer.current) clearTimeout(foldTimer.current);
    },
    [],
  );

  const changes = useMemo(
    () => villageAnswerChanges(questions, drafts),
    [questions, drafts],
  );

  // Waits for auth to settle: a signed-in viewer who reloads the page would
  // otherwise be bounced to 401 before the session is read back.
  if (isLoadingUser || isLoading) {
    return (
      <div className="bg-neutral-light min-h-screen flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) return <Page401 />;
  if (!village) return <PageNotFound error={t('villages_not_found')} />;
  if (isForbidden) return <Page401 />;

  const villagePath = `/villages/${village.slug || village._id}`;
  const { answered, total } = countAnsweredVillageQuestions(questions);
  const progress = total ? Math.round((answered / total) * 100) : 0;

  // A question that has just been answered stays in the open list until its
  // fold finishes — otherwise it would vanish between two frames.
  const isFolding = (question: VillageQuestion) =>
    folding.includes(question.id);
  const open = questions.filter(
    (question) => !question.answer?.trim() || isFolding(question),
  );
  const done = questions.filter(
    (question) => question.answer?.trim() && !isFolding(question),
  );

  // Shown once there is nothing left to ask, and again the moment a save adds
  // an answer — but never while the form is dirty again, which would thank
  // someone for words they have not sent yet.
  const showThanks =
    changes.length === 0 && (thanked || (total > 0 && open.length === 0));

  const handleSave = async () => {
    if (changes.length === 0) return;
    try {
      setIsSaving(true);
      setError(null);
      const result = await saveVillageAnswers(village._id, changes);
      // Adopt the list the route returned rather than patching the local one:
      // the nightly job may have reworded a question since this page loaded,
      // and the response is the only thing that knows.
      setQuestions(result.questions);
      setDrafts((current) => ({
        ...villageAnswerDrafts(result.questions),
        // Anything typed into a question the response no longer carries is not
        // silently thrown away — it stays in the box the viewer typed it in.
        ...Object.fromEntries(
          Object.entries(current).filter(
            ([id]) => !result.questions.some((question) => question.id === id),
          ),
        ),
      }));
      setHasSaved(true);

      // Only what the route confirms as answered folds away. A cleared answer
      // is a change too, and its card has to stay open to be filled in again.
      const foldable = result.questions
        .filter(
          (question) =>
            question.answer?.trim() &&
            changes.some(
              (change) => change.id === question.id && change.answer,
            ),
        )
        .map((question) => question.id);
      if (foldable.length === 0) return;

      setThanked(true);
      setFolding(foldable);
      if (foldTimer.current) clearTimeout(foldTimer.current);
      foldTimer.current = setTimeout(() => setFolding([]), FOLD_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('villages_action_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const thanks = (
    <div
      role="status"
      className="rounded-[22px] border border-accent-medium bg-accent-light px-6 py-7 text-center animate-fade-in-up motion-reduce:animate-none"
    >
      <span className="inline-flex w-10 h-10 rounded-full bg-accent text-accent-foreground items-center justify-center animate-checkmark-pop motion-reduce:animate-none">
        <Check className="w-5 h-5" />
      </span>
      <p className="font-serif text-2xl text-accent-text mt-4 leading-tight">
        {t('villages_questions_thanks_title')}
      </p>
      <p className="text-[14.5px] text-foreground/70 mt-2 max-w-md mx-auto leading-relaxed">
        {t('villages_questions_thanks_body')}
      </p>
    </div>
  );

  return (
    <>
      <Head>
        <title>
          {t('villages_questions_title')} — {village.name}
        </title>
      </Head>

      <PageShell width="narrow">
        <header className="mb-10">
          <Link
            href={villagePath}
            className="text-[13.5px] font-semibold text-accent-text hover:underline"
          >
            ← {village.name}
          </Link>
          <Eyebrow className="mt-5">{t('villages_questions_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('villages_questions_heading', { village: village.name })}
          </h1>
          <p className="text-[17px] text-foreground/70 leading-relaxed mt-4">
            {t('villages_questions_intro')}
          </p>
        </header>

        {total > 0 ? (
          <div className="rounded-[18px] border border-accent-medium bg-accent-light/40 px-5 py-4 mb-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13.5px] font-semibold text-accent-text">
                {t('villages_questions_progress', { answered, total })}
              </span>
              {answered === total ? (
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-accent-text">
                  <Check className="w-4 h-4" />
                  {t('villages_questions_all_done')}
                </span>
              ) : null}
            </div>
            <div
              className="mt-3 h-1.5 rounded-full bg-neutral-dark overflow-hidden"
              role="progressbar"
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={total}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {showThanks ? <div className="mb-8">{thanks}</div> : null}

        {total === 0 ? (
          <div className="rounded-[22px] border border-dashed border-accent-medium bg-accent-light/40 px-6 py-12 text-center">
            <p className="font-serif text-xl text-foreground">
              {t('villages_questions_empty_title')}
            </p>
            <p className="text-[14.5px] text-foreground/70 mt-2 max-w-md mx-auto">
              {t('villages_questions_empty_body')}
            </p>
            <Link href={villagePath} className={`${btnSmall} mt-6`}>
              {t('villages_questions_back_cta')}
            </Link>
          </div>
        ) : null}

        {/* No gap on the list: the spacing lives inside each row's fold, so it
            collapses along with the card instead of leaving a hole behind. */}
        <ol className="flex flex-col">
          {open.map((question, index) => (
            <li
              key={question.id}
              data-testid="village-question-row"
              data-folding={isFolding(question) ? 'true' : undefined}
              className={`grid transition-all duration-500 ease-in-out motion-reduce:transition-none ${
                isFolding(question)
                  ? 'grid-rows-[0fr] opacity-0'
                  : 'grid-rows-[1fr] opacity-100'
              }`}
            >
              <div className="overflow-hidden">
                <div className="mb-5">
                  <QuestionCard
                    question={question}
                    marker={<Marker>{index + 1}</Marker>}
                    draft={drafts[question.id] ?? ''}
                    isDirty={changes.some(
                      (change) => change.id === question.id,
                    )}
                    isDisabled={isSaving || isFolding(question)}
                    onChange={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* The answered ones, folded away but never gone: a founder can open
            the drawer and correct what they wrote. */}
        {done.length > 0 ? (
          <div className="mt-2">
            <button
              type="button"
              className="flex items-center gap-2 text-[13.5px] font-semibold text-accent-text"
              aria-expanded={showAnswered}
              onClick={() => setShowAnswered((current) => !current)}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 motion-reduce:transition-none ${
                  showAnswered ? 'rotate-180' : ''
                }`}
              />
              {t('villages_questions_answered_toggle', { count: done.length })}
            </button>

            {/* Rendered only when open, so a collapsed drawer never hides a
                focusable textarea from a keyboard or a screen reader. */}
            {showAnswered ? (
              <ol className="flex flex-col gap-5 mt-5 animate-fade-in-up motion-reduce:animate-none">
                {done.map((question) => (
                  <li key={question.id}>
                    <QuestionCard
                      question={question}
                      marker={<Marker done />}
                      draft={drafts[question.id] ?? ''}
                      isDirty={changes.some(
                        (change) => change.id === question.id,
                      )}
                      isDisabled={isSaving}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                    />
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        {error ? <ErrorMessage error={error} /> : null}

        {open.length > 0 || changes.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className={btnPrimary}
              disabled={isSaving || changes.length === 0}
              onClick={handleSave}
            >
              {isSaving ? <Spinner /> : null}
              {changes.length > 0
                ? t('villages_questions_save_count', { count: changes.length })
                : t('villages_questions_save')}
            </button>
            {changes.length === 0 && hasSaved && !showThanks ? (
              <span
                role="status"
                className="flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-text"
              >
                <Check className="w-4 h-4" />
                {t('villages_questions_saved')}
              </span>
            ) : null}
            <p className="text-[13px] text-foreground/50 basis-full">
              {t('villages_questions_save_hint')}
            </p>
          </div>
        ) : null}
      </PageShell>
    </>
  );
};

export default VillageQuestionsPage;
