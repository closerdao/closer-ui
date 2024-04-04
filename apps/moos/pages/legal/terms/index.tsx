import Head from 'next/head';
import { Heading } from 'closer/components/ui';
import { GeneralConfig, api, useConfig } from 'closer';

interface Props {
  generalConfig: GeneralConfig | null;
}

const TermsPage = ({ generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`${PLATFORM_NAME} terms and conditions`}</title>
        <meta name="description" content="Welcome Moos!" />
      </Head>

      <div className="flex w-full justify-center ">
        <div className="max-w-6xl w-full pt-20 flex flex-col gap-20 items-center">
          <section className="max-w-xl flex flex-col gap-12 ">
            <Heading className="" level={1}>
              Terms & Conditions
            </Heading>
            Text goes here
          </section>
        </div>
      </div>
    </div>
  );
};

TermsPage.getInitialProps = async () => {
  try {
    const [generalRes] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    return {
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: err,
    };
  }
};

export default TermsPage;
