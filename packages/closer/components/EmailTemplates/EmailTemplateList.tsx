import Link from 'next/link';

import { Card, Heading } from '../ui';

import { EmailTemplate } from '../../types/emailTemplate';

interface Props {
  templates: EmailTemplate[];
}

const EmailTemplateList = ({ templates }: Props) => {
  return (
    <div className="flex flex-col gap-3">
      {templates.map((template) => (
        <Link key={template.slug} href={`/dashboard/admin/emails/${template.slug}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex flex-col gap-2">
              <Heading level={4}>{template.name}</Heading>
              <span className="text-sm text-gray-500 font-mono">{template.slug}</span>
              {template.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default EmailTemplateList;
