import Link from 'next/link';
import { useRouter } from 'next/router';

import { ReactNode } from 'react';

import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmailTemplate } from '../../types/emailTemplate';
import AdminLayout from '../Dashboard/AdminLayout';
import { Heading } from '../ui';

interface Props {
  templates: EmailTemplate[];
  children: ReactNode;
  heading?: string;
  isBookingEnabled?: boolean;
}

const EmailTemplatesLayout = ({
  templates,
  children,
  heading,
  isBookingEnabled,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const slug = router.query.slug as string | undefined;

  return (
    <AdminLayout>
      <div className="w-full flex flex-col lg:flex-row lg:min-h-[calc(100vh-8rem)] gap-4 lg:gap-0">
        <aside className="lg:w-72 lg:min-w-72 flex-shrink-0 flex flex-col border border-gray-200 lg:border-r lg:border-t-0 lg:border-l-0 rounded-lg lg:rounded-none overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-shrink-0">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Mail className="w-5 h-5 text-accent" />
            </div>
            <div>
              <Heading level={4}>{t('admin_emails_title')}</Heading>
              <p className="text-xs text-gray-500 mt-0.5">
                {(templates ?? []).length} {t('admin_emails_templates_count')}
              </p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 min-h-0 max-h-[40vh] lg:max-h-none">
            {(templates ?? []).map((template) => {
              const isActive = slug === template.slug;
              return (
                <Link
                  key={template.slug}
                  href={`/dashboard/admin/emails/${template.slug}`}
                  className={`block rounded-lg px-3 py-2.5 text-sm transition-colors mb-1 ${
                    isActive
                      ? 'bg-accent-light text-accent-dark font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium block truncate">
                    {template.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">
          {heading && (
            <div className="mb-4">
              <Heading level={2}>{heading}</Heading>
            </div>
          )}
          {children}
        </main>
      </div>
    </AdminLayout>
  );
};

export default EmailTemplatesLayout;
