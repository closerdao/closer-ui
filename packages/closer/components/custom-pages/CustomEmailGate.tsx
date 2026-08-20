import { useTranslations } from 'next-intl';

import { useEmailGate } from '../../hooks/useEmailGate';
import { resolveBlockText } from '../../utils/blockI18n';
import Newsletter from '../Newsletter';
import { Heading } from '../ui';

export interface EmailGateContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaText?: string;
}

interface Props {
  settings?: { placement?: string };
  content?: EmailGateContent;
  embedded?: boolean;
}

/**
 * Collects an email before the blocks marked "gated" below it become visible.
 * Once unlocked (or for logged-in members) the gate removes itself.
 */
const CustomEmailGate = ({ settings, content, embedded }: Props) => {
  const t = useTranslations();
  const { isReady, isUnlocked, unlock } = useEmailGate();

  const pick = (raw: string | undefined, fallbackKey: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : t(fallbackKey);

  const title = pick(content?.title, 'email_gate_title');
  const description = pick(content?.description, 'email_gate_description');
  const ctaText = pick(content?.ctaText, 'email_gate_cta');
  const eyebrow = content?.eyebrow?.trim()
    ? resolveBlockText(content.eyebrow, t)
    : '';

  // In the editor the gate is always shown, otherwise it would be invisible to
  // whoever is arranging the page.
  if (!embedded && (!isReady || isUnlocked)) {
    return <div className="py-8" aria-hidden />;
  }

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6 text-center flex flex-col gap-4">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            {eyebrow}
          </p>
        ) : null}
        <Heading level={2} className="text-2xl md:text-3xl font-normal">
          {title}
        </Heading>
        <p className="text-base text-gray-700 leading-relaxed font-light">
          {description}
        </p>
        <div className="flex justify-center mt-4">
          <Newsletter
            placement={settings?.placement || 'dataroom'}
            className="sm:w-[420px] bg-white border border-gray-200 rounded-lg px-6"
            ctaText={ctaText}
            showTitle={false}
            requireTurnstile
            onSuccess={() => unlock()}
          />
        </div>
      </div>
    </section>
  );
};

export default CustomEmailGate;
