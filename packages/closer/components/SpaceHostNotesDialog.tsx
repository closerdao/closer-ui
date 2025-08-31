import { useEffect, useState } from 'react';

import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { usePlatform } from '../contexts/platform/platform';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
  Textarea,
} from './ui';

interface SpaceHostNotesDialogProps {
  bookingId: string;
  currentNotes?: string;
  guestName: string;
}

const SpaceHostNotesDialog = ({
  bookingId,
  currentNotes = '',
  guestName,
}: SpaceHostNotesDialogProps) => {
  const t = useTranslations();
  const { platform } = usePlatform() as { platform: any };

  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      await platform.booking.patch(bookingId, { spaceHostNotes: notes });

      setMessage({ type: 'success', text: t('notes_saved_successfully') });

      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);
    } catch (error) {
      console.error('Error saving notes:', error);
      setMessage({ type: 'error', text: t('error_saving_notes') });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNotes(currentNotes);
    }
  }, [currentNotes, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setNotes(currentNotes);
      setMessage(null);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="text-xs py-1 px-1 w-fit border-none enabled:bg-transparent bg-transparent"
          variant="secondary"
          size="small"
        >
          <NotebookPen size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('space_host_notes')} - {guestName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Textarea
              placeholder={t('enter_notes_placeholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>
          {message && (
            <div
              className={`text-sm p-2 rounded ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
            isEnabled={!isLoading}
          >
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSave} isEnabled={!isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpaceHostNotesDialog;
