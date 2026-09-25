import { FormEvent, ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';

import { parseMessageFromError } from '../../../utils/common';
import Modal from '../../Modal';
import { Button, Information } from '../../ui';
import Heading from '../../ui/Heading';
import { Textarea } from '../../ui/textarea';

interface Props {
  title: string;
  /** The action's own fields; the modal owns the reason every host change carries. */
  children?: ReactNode;
  canSubmit?: boolean;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}

const HostReasonModal = ({
  title,
  children,
  canSubmit = true,
  onSubmit,
  onClose,
}: Props) => {
  const t = useTranslations();
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await onSubmit(reason.trim());
      onClose();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal closeModal={onClose} className="sm:max-w-lg">
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Heading level={3}>{title}</Heading>
        {children}
        <div className="flex flex-col gap-1 text-sm">
          <label className="font-medium" htmlFor="host-reason">
            {t('host_actions_reason_label')}
          </label>
          <Textarea
            id="host-reason"
            aria-describedby="host-reason-hint"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
          <p id="host-reason-hint" className="text-xs text-disabled">
            {t('host_actions_reason_hint')}
          </p>
        </div>
        {error && (
          <Information className="border-error/30 bg-error/10 text-foreground">
            {error}
          </Information>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            isLoading={isSaving}
            isEnabled={canSubmit && reason.trim().length > 0}
          >
            {t('host_actions_submit')}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('generic_cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HostReasonModal;
