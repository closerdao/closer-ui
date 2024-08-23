import Head from 'next/head';
import { useRouter } from 'next/router';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import models from '../../models';
import { loadLocaleData } from '../../utils/locale.helpers';

const CreateFood = () => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{t('food_create_title')}</title>
      </Head>
      <div className="justify-center flex">
        <section className="max-w-4xl w-full">
          <Heading level={2} className="mb-2">
            {t('food_create_title')}
          </Heading>
          <EditModel
            endpoint={'/food'}
            fields={models.food}
            onSave={() => router.push('/food')}
          />
        </section>
      </div>
    </>
  );
};

CreateFood.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default CreateFood;
