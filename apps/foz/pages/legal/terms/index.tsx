import Head from 'next/head';

import { GeneralConfig, Heading, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

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
        <title>{`Terms of use - ${PLATFORM_NAME}!`}</title>
        <meta
          name="description"
          content="Foz is a regenerative playground in Portugal."
        />
      </Head>
      <section className="flex justify-center w-full">
        <div className="max-w-3xl w-full p-6 flex flex-col gap-4">
          <Heading level={1}>Terms of Use</Heading>

          <Heading level={2}>1. Introduction</Heading>
          <p>
            Welcome to www.fozdacova.world (the &ldquo;Website&rdquo;). These Terms of Use
            (&ldquo;Terms&rdquo;) govern your access to and use of the Website, any content
            available on the Website (including but not limited to text, data,
            images, videos, and other materials) (the &ldquo;Content&rdquo;), and any
            services offered through the Website (the &ldquo;Services&rdquo;).
          </p>

          <Heading level={2}>2. Acceptance of Terms</Heading>
          <p>
            By accessing or using the Website, you agree to be bound by these
            Terms. If you do not agree to all of these Terms, you are not
            authorized to use the Website.
          </p>

          <Heading level={2}>3. Content and Intellectual Property</Heading>
          <p>
            The Content on the Website is owned by Foz da Cova or its licensors
            and is protected by copyright, trademark, and other intellectual
            property laws. You may not modify, publish, distribute, transmit,
            reproduce, create derivative works from, or in any way exploit any
            of the Content, in whole or part, except as expressly permitted by
            these Terms.
          </p>

          <Heading level={2}>4. User Conduct</Heading>
          <p>
            You agree to use the Website in a lawful and respectful manner. You
            agree not to:
          </p>
          <ul>
            <li>Use the Website for any illegal or unauthorized purpose.</li>
            <li>Infringe upon the intellectual property rights of others.</li>
            <li>Transmit any harmful, offensive, or defamatory content.</li>
            <li>Interfere with the normal operation of the Website.</li>
            <li>Impersonate any person or entity.</li>
          </ul>

          <Heading level={2}>5. Booking Services</Heading>
          <p>
            The Website allows you to make bookings for various services offered
            by Foz da Cova. When making a booking, you agree to provide accurate
            and complete information. You are responsible for any fees or
            charges associated with your bookings.
          </p>

          <Heading level={2}>6. Disclaimer of Warranties</Heading>
          <p>
            The Website and the Content are provided &ldquo;as is&ldquo; and without
            warranties of any kind, express or implied. Foz da Cova disclaims
            all warranties, including but not limited to, the warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement of intellectual property rights.
          </p>

          <Heading level={2}>7. Limitation of Liability</Heading>
          <p>
            Foz da Cova shall not be liable for any damages arising out of your
            use of the Website or the Content, including but not limited to,
            direct, indirect, incidental, consequential, or punitive damages.
          </p>

          <Heading level={2}>8. Termination</Heading>
          <p>
            Foz da Cova reserves the right, in its sole discretion, to terminate
            your access to the Website for any reason, with or without notice.
          </p>

          <Heading level={2}>9. Governing Law</Heading>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of Portugal.
          </p>

          <Heading level={2}>10. Entire Agreement</Heading>
          <p>
            These Terms constitute the entire agreement between you and Foz da
            Cova with respect to your use of the Website.
          </p>

          <Heading level={2}>11. Changes to Terms</Heading>
          <p>
            Foz da Cova reserves the right to change these Terms at any time.
            The revised Terms will be effective immediately upon posting on the
            Website. You agree to review the Terms regularly and to be bound by
            any revisions.
          </p>

          <Heading level={2}>12. Contact Us</Heading>
          <p>
            If you have any questions about these Terms, please contact us at{' '}
            <a href="mailto:community.fozdacova@gmail.com">
              community.fozdacova@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
};

TermsPage.getInitialProps = async (context: NextPageContext) => {
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

export default TermsPage;
