import { useState } from 'react';

import { useTranslations } from 'next-intl';

import JoinWebinarPrompt from '../JoinWebinarPrompt';
import { Button, Heading } from '../ui';

interface Props {
  id?: string;
}

// Token sale Ama component

const Ama = ({ id }: Props) => {
  const t = useTranslations();

  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const joinWebinar = () => {
    setIsPromptOpen(true);
  };

  return (
    <section id={id} className="flex items-center flex-col py-24 ">
      {isPromptOpen && <JoinWebinarPrompt setIsPromptOpen={setIsPromptOpen} />}
      <div className="max-w-6xl ">
        <div className="text-center mb-8">
          <Heading level={2} className="mb-4 text-5xl font-bold">
            {t('token_sale_ama_heading')}
          </Heading>
          <div className="w-full flex justify-center">
            <Heading level={3} className="mb-4 text-lg font-bold max-w-[600px]">
              {t('token_sale_ama_subheading')}
            </Heading>
          </div>
        </div>

        <div className="flex items-center">
          <Button className="text-[16px]" onClick={joinWebinar}>
            {t('token_sale_join_webinar')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Ama;
