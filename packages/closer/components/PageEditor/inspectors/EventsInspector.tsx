import { useTranslations } from 'next-intl';

import type { BlockInspectorFormProps } from './types';

const EventsInspector = (_props: BlockInspectorFormProps) => {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 leading-relaxed bg-neutral-light rounded-md p-3 border border-gray-100">
        {t('pages_editor_events_hint')}
      </p>
    </div>
  );
};

export default EventsInspector;
