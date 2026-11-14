import { useTranslations } from 'next-intl';

const EXAMPLES = [
  'pages_editor_field_link_help_example_page',
  'pages_editor_field_link_help_example_section',
  'pages_editor_field_link_help_example_web',
] as const;

const LinkHint = () => {
  const t = useTranslations();
  return (
    <p className="text-xs text-gray-500 mt-1">
      {t('pages_editor_field_link_help')}{' '}
      {EXAMPLES.map((key, index) => (
        <span key={key}>
          {index > 0 ? ' · ' : null}
          <code className="whitespace-nowrap">{t(key)}</code>
        </span>
      ))}
    </p>
  );
};

export default LinkHint;
