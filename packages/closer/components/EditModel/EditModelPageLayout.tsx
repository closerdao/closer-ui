import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import Heading from '../ui/Heading';

interface EditModelPageLayoutProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  isEdit?: boolean;
}

const EditModelPageLayout: FC<EditModelPageLayoutProps> = ({
  title,
  subtitle,
  backHref,
  backLabel,
  children,
  isEdit,
}) => {
  const t = useTranslations();
  const label = backLabel ?? t('generic_back');

  return (
    <div className="main-content max-w-3xl">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span>{label}</span>
        </Link>
      )}
      <header className="mb-8">
        <Heading level={2} className="mb-2">
          {title}
        </Heading>
        {subtitle && (
          <p className="text-foreground/70 text-base leading-relaxed">
            {subtitle}
          </p>
        )}
      </header>
      <div className={isEdit ? '' : 'mt-2'}>{children}</div>
    </div>
  );
};

export default EditModelPageLayout;
