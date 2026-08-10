import { useTranslations } from 'next-intl';

import Button from '../ui/Button';

const AGREEMENT_SECTIONS = [
  ['cohousing_agreement_s1_t', 'cohousing_agreement_s1_b'],
  ['cohousing_agreement_s2_t', 'cohousing_agreement_s2_b'],
  ['cohousing_agreement_s3_t', 'cohousing_agreement_s3_b'],
  ['cohousing_agreement_s4_t', 'cohousing_agreement_s4_b'],
  ['cohousing_agreement_s5_t', 'cohousing_agreement_s5_b'],
  ['cohousing_agreement_s6_t', 'cohousing_agreement_s6_b'],
  ['cohousing_agreement_s7_t', 'cohousing_agreement_s7_b'],
  ['cohousing_agreement_s8_t', 'cohousing_agreement_s8_b'],
  ['cohousing_agreement_s9_t', 'cohousing_agreement_s9_b'],
] as const;

export const CohousingAgreementModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const t = useTranslations();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex justify-between items-center px-5 py-3.5 border-b border-gray-200 bg-gray-50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {t('cohousing_agreement_modal_title')}
          </span>
          <Button isFullWidth={false} size="small" variant="secondary" onClick={onClose}>
            {t('cohousing_agreement_close')}
          </Button>
        </div>
        <div className="px-6 sm:px-10 py-8">
          <h2 className="font-sans font-black text-3xl sm:text-4xl uppercase text-gray-900 tracking-tight leading-none mb-4">
            {t('cohousing_agreement_heading')}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            {t('cohousing_agreement_intro')}
          </p>

          {AGREEMENT_SECTIONS.map(([tk, bk]) => (
            <div key={tk} className="mb-6">
              <h3 className="font-sans font-black text-lg uppercase text-gray-900 mb-2">
                {t(tk)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{t(bk)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
