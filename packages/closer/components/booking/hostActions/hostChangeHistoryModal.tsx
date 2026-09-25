import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { useTranslations } from 'next-intl';

import type { HostChangeEntry } from '../../../types/stay';
import { parseMessageFromError } from '../../../utils/common';
import { getStayChanges } from '../../../utils/stays.api';
import Modal from '../../Modal';
import { Button, Information } from '../../ui';
import Heading from '../../ui/Heading';
import {
  describeHostChange,
  hostChangeActionLabel,
} from './hostChangeLog.helpers';

dayjs.extend(LocalizedFormat);

interface Props {
  stayId: string;
  onClose: () => void;
}

const HostChangeHistoryModal = ({ stayId, onClose }: Props) => {
  const t = useTranslations();
  const [entries, setEntries] = useState<HostChangeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getStayChanges(stayId, page)
      .then((result) => {
        if (cancelled) return;
        setEntries((prev) =>
          page === 1 ? result.entries : [...prev, ...result.entries],
        );
        setTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) setError(parseMessageFromError(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stayId, page]);

  return (
    <Modal closeModal={onClose} className="sm:max-w-2xl">
      <div className="flex flex-col gap-4">
        <Heading level={3}>{t('host_actions_history')}</Heading>
        {error && (
          <Information className="border-error/30 bg-error/10 text-foreground">
            {error}
          </Information>
        )}
        {!isLoading && !error && entries.length === 0 && (
          <p className="text-sm">{t('host_change_history_empty')}</p>
        )}
        {entries.length > 0 && (
          <ol className="flex flex-col divide-y divide-line">
            {entries.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className="flex flex-col gap-1 py-3 text-sm"
              >
                <p className="text-xs text-disabled">
                  {dayjs(entry.at).format('LLL')} ·{' '}
                  {entry.by?.screenname || t('host_change_someone')}
                </p>
                <p className="font-medium">
                  {hostChangeActionLabel(entry.action, t)}
                </p>
                {describeHostChange(entry).map((line) => (
                  <p key={line} className="break-words">
                    {line}
                  </p>
                ))}
                {entry.reason && (
                  <p className="text-disabled">
                    {t('host_actions_reason_label')}: {entry.reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {entries.length < total && (
          <Button
            variant="secondary"
            isLoading={isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('host_change_history_more')}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default HostChangeHistoryModal;
