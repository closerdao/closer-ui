import { useTranslations } from 'next-intl';

import {
  LEADS_GLOSSARY,
  LEADS_QUALIFICATION_BLURB,
} from '../../constants/leadsGlossary';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

interface Props {
  /** The qualification criteria only apply to the leads board. */
  showQualification?: boolean;
}

/**
 * What the objects on this page are and how they relate, collapsed by default.
 *
 * Collapsed because it is read once: someone new to the board opens it in their
 * first hour and never again. On the page rather than in a handbook for the
 * same reason — the moment the question comes up is the moment they are looking
 * at the tabs, and a link somewhere else is a link nobody follows.
 */
const LeadsGlossary = ({ showQualification = false }: Props) => {
  const t = useTranslations();

  return (
    <Accordion type="single" collapsible data-testid="leads-glossary">
      <AccordionItem value="glossary">
        <AccordionTrigger>
          {t('dashboard_leads_glossary_title')}
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-3 pt-2 font-normal">
            {LEADS_GLOSSARY.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-gray-900">
                  {entry.term}
                </span>
                <p className="text-sm text-gray-700">{entry.definition}</p>
                <p className="text-sm text-gray-500">{entry.relation}</p>
              </div>
            ))}
            {showQualification && (
              <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">
                {LEADS_QUALIFICATION_BLURB}
              </p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default LeadsGlossary;
