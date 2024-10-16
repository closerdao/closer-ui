import Head from 'next/head';

import { GeneralConfig, Heading, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta
          name="description"
          content="Foz is a regenerative playground in Portugal."
        />
      </Head>
      <section className="flex justify-center w-full">
        <div className="max-w-3xl w-full p-6 flex flex-col gap-4">
          <Heading level={1}>Bemvindo a Foz da Cova!</Heading>
          <p>Dear Visitor, welcome to Foz Da Cova!</p>

          <p>
            Foz da Cova is a Portuguese former and forgotten village, nestled in
            a valley somewhere between Goís and Arganil (close to Coimbra).
          </p>
          <p>
            After being uninhabited for more than 35 years, you and us, are
            currently in the process of rebuilding a magical place.
          </p>
          <p>
            We call it our home, and invite you warmly to make it yours too.
          </p>
          <p>
            We look forward to welcoming you in the mountains, providing you
            with:
          </p>
          <p>Our own fresh drinking water from the mountain</p>
          <p>
            Houses with all amenities you expect (internet, warm water,
            electricity, stoves, laundry machine, kitchen, board games etc.)
          </p>
          <p>Little music studio, a piano and soon a sauna too!</p>
          <p>Beautiful sceneries to unwind and re-energize yourself</p>
          <p>
            Ancient terraces, some going back as far as the Romans, constitute
            the backdrop for our little idyll.
          </p>
          <p>
            We are working on many different projects (from regenerative
            agriculture to music to workshops), and are always happy for any
            helping hands!
          </p>
          <p>
            For any short term questions, join our{' '}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://t.me/+1AgaKMNgEHFmYTNk"
            >
              Telegram group
            </a>
            .
          </p>
          <p>Before coming, please Register your stay 🙂</p>
          <p>Até já!</p>
          <p>Your Foz da Covians</p>
        </div>
      </section>
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default HomePage;
