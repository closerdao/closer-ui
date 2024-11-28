import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

// import { loadLocaleData } from 'closer/utils/locale.helpers';
import PageError from 'closer/components/PageError';
import { Heading, LinkButton } from 'closer/components/ui';

import { GeneralConfig, api } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
  error: string | null;
}

const VolunteerOpportunitiesPage = ({ generalConfig, error }: Props) => {
  const t = useTranslations();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`Volunteers Open Call - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className=" pb-24">
        <section className="w-full flex justify-center max-w-4xl mx-auto mb-4 relative">
          <Image
            alt="Traditional Dream Factory Volunteers open call"
            src="/images/tdf-volunteers-open-call.png"
            width={1344}
            height={600}
          />
        </section>
        <section className=" w-full flex justify-center">
          <div className="max-w-4xl w-full ">
            <div className="w-full py-2">
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex gap-1 items-center min-w-[120px]">
                  <Image
                    alt="calendar icon"
                    src="/images/icons/calendar-icon.svg"
                    width={20}
                    height={20}
                  />
                  <label className="text-sm uppercase font-bold flex gap-1">
                    Any time
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row">
              <div className="flex items-start justify-between gap-6 w-full">
                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-center pt-4">
                    <Heading level={1} className="md:text-4xl  font-bold">
                      Volunteers Open Call
                    </Heading>
                    <div className=" w-full sm:w-[250px]">
                      <LinkButton href="/volunteer/apply">
                        {t('apply_submit_button')}
                      </LinkButton>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6 max-w-2xl">
                    <p>
                      We are excited to extend an invitation to join us at the
                      Traditional Dream Factory, a regenerative farm and
                      co-living development in Abela, Alentejo, Portugal.
                    </p>
                    <p>
                      We are looking for enthusiastic individuals who are
                      interested in living, learning, and contributing to a
                      vibrant and growing community based on respect for the
                      land and each other. As a volunteer at TDF, you will have
                      the chance to participate in a variety of activities:
                    </p>
                    <p>
                      <strong className="uppercase">Requirements: </strong>4
                      hours per day, 2 weeks minimum ✅ Free accommodation
                      (glamping tents and dorms available, or bring your van)
                    </p>
                    <p>
                      <strong className="uppercase">Community culture: </strong>
                      To join us, you should align with our community&apos;s
                      values, be open to learning, sharing, and working, and be
                      excited to contribute to our collective efforts. Our
                      community is about more than just work; it&apos;s about
                      having fun, growing together, and sharing in the
                      co-creation of our land and experiences. 🥙💃🏽🔥🎶🎭
                    </p>
                    <Heading level={2}>
                      Skill & qualifications that can support us 👍🏼
                    </Heading>
                    <ul className="mb-4 list-disc pl-5">
                      <li>
                        <strong>Gardening:</strong> Experience hands-on
                        regenerative agriculture, learn about permaculture, and
                        contribute to our food production.
                      </li>
                      <li>
                        <strong>Hospitality:</strong> Assist in maintaining a
                        welcoming environment for all of our community members
                        and visitors, including cleaning, bed dressing, and
                        making people feel at home.
                      </li>
                      <li>
                        <strong>Kitchen and Cooking:</strong> Help prepare
                        delicious and nutritious meals using fresh produce from
                        our garden.
                      </li>
                      <li>
                        <strong>Building Projects:</strong> Use and develop your
                        skills to contribute to various building projects around
                        the property, from furniture to social areas, outdoor
                        showers, or building smart systems like helophyte
                        filters or biopools.
                      </li>
                      <li>
                        <strong>Others:</strong> As part of a dynamic community,
                        there will be many other opportunities to learn,
                        contribute, and grow.
                      </li>
                    </ul>
                    <p>
                      We ask for a minimum commitment of two weeks. In return,
                      you&apos;ll be immersed in our community, gaining
                      invaluable experience and insights, and contributing to a
                      meaningful project.
                    </p>
                    <p>
                      We expect volunteers to contribute four hours of work each
                      day, five days a week. Before you apply, we recommend
                      reading our{' '}
                      <Link
                        href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit?tab=t.0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        pink paper
                      </Link>
                      , which details our community&apos;s culture and
                      processes. If our vision resonates with you and
                      you&apos;re eager to play, learn, and create with us,
                      we&apos;d love to hear from you. Check our{' '}
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://docs.google.com/document/d/198vWYEQCC1lELQa8f76Jcw3l3UDiPcBKt04PGFKnUvg/edit?tab=t.0"
                      >
                        Visitor&apos;s Guide
                      </Link>{' '}
                      and let&apos;s schedule a call to know each other by
                      sending an email to{' '}
                      <Link href="mailto:space@traditionaldreamfactory.com">
                        space@traditionaldreamfactory.com
                      </Link>
                      .
                    </p>
                    <p>
                      The recommended stay is 1 month - and ideally coming in
                      the beginning of the month so that we can have a good
                      group dynamic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

VolunteerOpportunitiesPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    const [messages, generalRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/general').catch(() => null),
      api.get('/project').catch(() => {
        return null;
      }),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return { messages, generalConfig };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default VolunteerOpportunitiesPage;
