import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import Hosts from 'closer/components/Hosts';
import ListingListPreview from 'closer/components/ListingListPreview';

import {
  BookingConfig,
  GeneralConfig,
  Heading,
  LinkButton,
  YoutubeEmbed,
  __,
  api,
  useAuth,
  useConfig,
  usePlatform,
} from 'closer';
import { parseMessageFromError } from 'closer/utils/common';

interface Props {
  generalConfig: GeneralConfig | null;
  bookingSettings: BookingConfig | null;
}

const HomePage = ({ generalConfig, bookingSettings }: Props) => {
  const { isAuthenticated } = useAuth();

  const { APP_NAME } = useConfig();
  const appName = APP_NAME && APP_NAME.toLowerCase();

  const config = useConfig();
  const discounts = {
    daily: bookingSettings?.discountsDaily,
    weekly: bookingSettings?.discountsWeekly,
    monthly: bookingSettings?.discountsMonthly,
  };

  const { TEAM_EMAIL } = config || {};
  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );
  const listingFilter = {
    where: {
      availableFor: {
        $in: ['guests', isTeamMember ? 'team' : null].filter((e) => e),
      },
    },
  };
  const hostsFilter = {
    where: {
      roles: { $in: ['space-host', 'steward', 'team'].filter((e) => e) },
    },
  };

  const loadData = async () => {
    await Promise.all([
      platform.listing.get(listingFilter),
      platform.user.get(hostsFilter),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [isTeamMember]);

  const listings = platform.listing.find(listingFilter);

  const hosts = platform.user.find(hostsFilter);

  const CTA = isAuthenticated ? (
    <Link
      href="/stay"
      type="submit"
      className="font-accent lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
    >
      full programme
    </Link>
  ) : (
    <div className="flex gap-4">
      <Link
        href="/stay"
        type="submit"
        className="font-accent lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
      >
        full programme{' '}
      </Link>
      <Link
        href="/signup"
        type="submit"
        className="font-accent lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
      >
        join the dream
      </Link>
    </div>
  );
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
      </Head>
      <section className="md:absolute md:-top-2 overflow-hidden md:left-0 md:h-[100vh] md:min-w-[100vw] md:min-h-[100vh] bg-accent-light mb-8 md:mb-[100vh]">
        <div className="md:h-[100vh]">
          {isMobile ? (
            <video
              loop={true}
              muted={true}
              autoPlay={true}
              playsInline={true}
              className="w-full h-full object-cover"
            >
              <source
                src="https://cdn.oasa.co/video/tdf-360-mute.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <YoutubeEmbed isBackgroundVideo={true} embedId="VkoqvPcaRpk" />
          )}
        </div>
        <div className="md:absolute md:left-0 md:top-0 md:w-full md:h-full md:bg-black/20 flex justify-center ">
          <div className="w-full flex justify-center flex-col items-center ">
            <div className=" max-w-4xl p-6 rounded-xl flex flex-col items-center gap-10">
              <Image
                className="drop-shadow-sm"
                src="/images/sygnet.png"
                width={300}
                height={300}
                alt="Lios labs"
              />
              <Heading
                className="mb-4 text-2xl md:text-4xl normal-case font-accent-alt text-white drop-shadow-md"
                data-testid="page-title"
                display
                level={1}
              >
                A Desert school of ecological imagination.
              </Heading>

              <div className="w-full flex justify-end">{CTA}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative md:top-[105vh]">
        <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
          <div className="text-accent">
            <Heading
              level={2}
              display
              className="text-center mb-6 md:text-3xl normal-case"
            >
              Join the wild faculty of transformation
            </Heading>
            <p className="text-center mb-6">
              Come and stay in our desert village and let your imagination roam
              freely. Get a chance to learn about local ecosystems, regenerative
              cultures, transition design, and practice agency in a playful way.
            </p>{' '}
            <p className="text-center mb-6">
              You’ll have the opportunity to immerse in communal experiences
              while surrounded by the unique ecosystem of Błędowska Desert. We
              encourage you to be open to adventurous conditions and let them
              transform you, to embrace the raw beauty and complexity of Nature.
            </p>
            <p className="text-center mb-6">
              We guarantee you’ll meet some inspiring creatures you’ll become
              friends with. You will have a chance to join workshops and
              experiments merging art, ecology, system thinking and science. If
              this invitation sounds like something for you, there are plenty of
              ways to get involved. Follow the dusty trail.
            </p>
          </div>
        </section>

        <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
          <div className="flex flex-col gap-4 text-accent-alt">
            <Heading
              level={2}
              display
              className="text-center mb-6 md:text-2xl normal-case"
            >
              Before the wild adventure begins... please read our Desert Values:
            </Heading>
            <p>
              Desert Transformation Lab is shaped by shared ethics: equity of
              all beings, awareness, ecology, care, queerness, wholeness,
              non-violence, community, and sustainability. What does it mean in
              practice?
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Active Participation
            </Heading>
            <p>
              We know that transformative change can occur only through deeply
              personal participation - on individual, collective, and societal
              levels. We encourage you to embrace learning by doing. Everyone is
              invited to work for the common good of our planet and its
              inhabitants. All participants are involved in the daily routine of
              the village and are asked to comply with the <Link className='text-accent no-underline' href='https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link'>Desert Guidelines</Link>.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Sustainability
            </Heading>
            <p>
              Sustainability lies at the core of Desert Transformation Lab and
              we wish to incorporate it into our daily practice. The residency
              is an ideal ecosystem for developing new habits and rethinking
              their impact on the natural environment. Create a positive trace:
              We are a regenerative playground. Come and leave a mark that
              future generations will appreciate.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Consent
            </Heading>
            <p>
              Bring awareness to your boundaries & needs, respect those of
              others. If it’s not a full yes, then it’s a no.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Radical Self-Reliance
            </Heading>
            <p>
              When you come to the Desert Transformation Lab, you are
              responsible for your own survival, safety, comfort, and well-being
              of yourself and the village.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Gift Economy
            </Heading>
            <p>
              What is your deepest gift that you can share with the community?
              How we can collectively practice non-capitalistic forms of
              exchange that are based on mutual care?
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Decommodification
            </Heading>
            <p>
              To preserve the spirit of gifting, our community seeks to create
              social environments that are unmediated by commercial
              sponsorships, transactions, or advertising. We stand ready to
              protect our culture from such exploitation. We resist the
              substitution of consumption for participatory experience.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Communal Effort
            </Heading>
            <p>
              Our community values creative cooperation and collaboration. We
              strive to produce, promote and protect social networks, public
              spaces, works of art, and methods of communication that support
              such interaction.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Ecological Awareness
            </Heading>
            <p>
              Desert Transformation Lab is nested in Eagle’s Nest Landscape
              Park, within the dunes of Błędowska Desert, an ecosystem that is
              part of the Natura 2000 protection program. You are invited to
              meet our neighbours, human and more than human, and please be
              respectful and aware that their needs may be different from yours.
            </p>
          </div>
        </section>

        <section className="mb-12 max-w-4xl mx-auto md:pt-8 md:flex justify-center">
          <div className="flex gap-8">
            <LinkButton href='/stay' className="lowercase">apply to stay</LinkButton>
            <LinkButton href='/volunteer' className="lowercase">join as a volunteer</LinkButton>
          </div>
        </section>

        <section className="mb-12 max-w-4xl mx-auto md:pt-20 md:flex justify-center">
          <Hosts hosts={hosts} email={TEAM_EMAIL} />
        </section>

        <section className="w-full  min-h-[600px] mx-auto py-10  md:flex justify-center bg-[url(/images/lios-bg.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-4 max-w-4xl">
            <Heading
              level={2}
              className="text-2xl mb-8 max-w-prose text-white "
            >
              {__('stay_chose_accommodation', appName)}
            </Heading>
            <div className="flex justify-center">
              {listings && listings.count() > 0 && (
                <div className="grid md:grid-cols-3 gap-x-12 md:gap-x-5 gap-y-16">
                  {listings.map((listing: any, index: number) => {
                    if (index <= 2) {
                      return (
                        <ListingListPreview
                          discounts={discounts}
                          isAdminPage={false}
                          key={listing.get('_id')}
                          listing={listing}
                        />
                      );
                    }
                  })}
                </div>
              )}
              {listings?.count() === 0 && __('listing_no_listings_found')}
            </div>
          </div>
        </section>

        <section className="min-h-[600px] mx-auto md:pt-20 md:pb-10 md:flex justify-center bg-[url(/images/lios-bg-2.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-8 items-center">
            <Heading
              level={2}
              className="text-6xl"
            >
              HOW TO PLAY
            </Heading>
            <Heading
              level={3}
              className="font-body mb-8 text-lg"
            >
              DESERT ROLES & ARCHETYPES
          </Heading>
          
          <div className='max-w-4xl'>
            <div className='flex gap-24 justify-between text-accent'>
              <div className='flex flex-col gap-12 items-center'>
                <Heading
                  level={4}
                  className="text-lg uppercase"
                >
                  Desert guide
                </Heading>
                <p className='text-center'>Become one of the caretakers and facilitators of the Desert Transformation Lab and guide others through this wild faculty.</p>
                <LinkButton className='w-[150px]'>Apply</LinkButton>
              </div>
              <div className='flex flex-col gap-12 items-center'>
                <Heading
                  level={4}
                  className="text-lg uppercase"
                >
                  Participant
                </Heading>
                <p className='text-center'>Visit and study at the School of Ecological Imagination, experience communal living in a unique ecosystem and get involved in something bigger than yourself.</p>
                  <LinkButton href='/stay' className='w-[150px]'>Join</LinkButton>
              </div>
              <div className='flex flex-col gap-12 items-center'>
                <Heading
                  level={4}
                  className="text-lg uppercase"
                >
                  Volunteer
                </Heading>
                <p className='text-center'>Join the our Desert troupe as one of the Special Agents in the area of your choosing and become a part of the transformation.</p>
                <LinkButton href='/volunteer' className='w-[150px]'>Apply</LinkButton>
              </div>
            </div>

              <div className='flex flex-col items-center gap-4 pt-12'>
                <Link className='font-accent uppercase text-accent' href='https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link'>DESERT GUIDELINES - PDF</Link>
                <Image src='/images/lios-logo-sm.png' alt='Lios Labs logo' width={90} height={90} />
              </div>
          </div>
          
          </div>
        </section>

        <section className="mb-12 min-h-[600px] mx-auto md:pt-20 md:pb-10 md:flex justify-center bg-neutral">
          <div className="flex flex-col gap-8 items-center">
          <Image src='/images/planetary-movement.png' alt='Lios planetary movement' width={380} height={342} />

            <Heading
              level={2}
              className="text-2xl uppercase"
            >
              Desert Transformation lab
            </Heading>
           
            <LinkButton href='https://lios.io' className='w-[150px]'>Website</LinkButton>
            <LinkButton className='w-[250px]'>PROGRAMME OUTLINE</LinkButton>
          
          </div>
        </section>

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const [bookingResponse, generalRes] = await Promise.all([
      api.get('/config/booking').catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const bookingSettings = bookingResponse?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      bookingSettings,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      bookingSettings: null,
      error: parseMessageFromError(err),
    };
  }
};

export default HomePage;