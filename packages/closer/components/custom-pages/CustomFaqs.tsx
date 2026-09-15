import React from 'react';

import Faqs from 'closer/components/Faqs';

import { useFaqs } from 'closer/hooks/useFaqs';

const CustomFaqs = ({ content }: { content: { googleSheetId: string } }) => {
  const { faqs, error } = useFaqs(content.googleSheetId);
  return (
    <div className="w-full sm:w-[400px] md:w-[860px] mx-auto flex flex-col gap-4">
      <Faqs faqs={faqs} error={error} />
    </div>
  );
};

export default CustomFaqs;
