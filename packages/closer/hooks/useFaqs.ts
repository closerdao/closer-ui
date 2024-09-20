import { useEffect, useState } from 'react';

import { FormattedFaqs } from '../types/resources';
import { prepareFaqsData } from '../utils/resources';

export const useFaqs = (googleSheetId: string) => {
  const [faqs, setFaqs] = useState<null | FormattedFaqs[]>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (googleSheetId) {
      (async () => {
        try {
          const response = await fetch(
            `https://docs.google.com/spreadsheets/d/${googleSheetId}/gviz/tq?tqx=out:json`,
          );
          const res = await response.text();
          const json = JSON.parse(
            res.replace(
              /.*google\.visualization\.Query\.setResponse\(\{([\s\S]*?)\}\);?/,
              '{$1}',
            ),
          );
          const faqsData = json.table.rows.slice(1);
          setFaqs(prepareFaqsData(faqsData));
        } catch (error) {
          setError('Error fetching FAQs');
        }
      })();
    }
  }, [googleSheetId]);

  return { faqs, error };
};
