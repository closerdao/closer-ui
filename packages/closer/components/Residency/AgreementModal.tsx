import { FC } from 'react';

import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui';

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roleTitle: string;
  agreementVersion: string;
  body: string;
}

/**
 * `remark-gfm` is not installed, so the generated agreement uses lists rather
 * than tables — see `agreementTemplate.ts`. Headings, emphasis and lists all
 * render with the core parser.
 */
const agreementMarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="mb-3 mt-0 text-xl font-bold text-complimentary-core">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mb-2 mt-6 text-base font-bold text-complimentary-core">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mb-1 mt-4 text-sm font-semibold text-complimentary-core">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="mb-3 text-sm leading-relaxed text-complimentary-light">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-complimentary-light marker:text-line">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-complimentary-light">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="break-words">{children}</li>,
  strong: ({ children }: any) => (
    <strong className="font-semibold text-complimentary-core">
      {children}
    </strong>
  ),
  hr: () => <hr className="my-5 border-line" />,
};

const AgreementModal: FC<Props> = ({
  isOpen,
  onOpenChange,
  roleTitle,
  agreementVersion,
  body,
}) => {
  const t = useTranslations();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('residency_agreement_modal_title')}</DialogTitle>
          <DialogDescription>
            {t('residency_agreement_modal_subtitle', {
              role: roleTitle,
              version: agreementVersion,
            })}
          </DialogDescription>
        </DialogHeader>
        <article className="min-w-0 max-w-none break-words">
          <ReactMarkdown components={agreementMarkdownComponents}>
            {body}
          </ReactMarkdown>
        </article>
      </DialogContent>
    </Dialog>
  );
};

export default AgreementModal;
