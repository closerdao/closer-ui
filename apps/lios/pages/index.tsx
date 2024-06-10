import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import Faqs from 'closer/components/Faqs';
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
import { useFaqs } from 'closer/hooks/useFaqs';
import { parseMessageFromError } from 'closer/utils/common';

interface Props {
  generalConfig: GeneralConfig | null;
  bookingSettings: BookingConfig | null;
}

const HomePage = ({ generalConfig, bookingSettings }: Props) => {
  const { isAuthenticated } = useAuth();

  const { APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};

  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);

  const loadData = async () => {
    await Promise.all([
      platform.listing.get(listingFilter),
      platform.user.get(hostsFilter),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [isTeamMember]);

  useEffect(() => {
    setIsSmallScreen(isMobile);

    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          console.log('can autoplay');
          setIsAutoplaying(true);
        })
        .catch(() => {
          console.log('cant autoplay');
          setIsAutoplaying(false);
        });
    }
  }, [videoRef.current]);

  const listings = platform.listing.find(listingFilter);

  const hosts = platform.user.find(hostsFilter);

  const CTA = isAuthenticated ? (
    <Link
      href="https://lios.io/program"
      type="submit"
      className="font-accent lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
    >
      full programme
    </Link>
  ) : (
    <div className="flex gap-4 flex-col sm:flex-row">
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
          content="Desert Transformation Lab is an experimental school of ecological imagination in Błędowska Desert, Poland."
        />
      </Head>
      <section className="w-[100vw] md:w-[calc(100vw+16px)] -mx-4 absolute -top-2 overflow-hidden md:left-0 md:h-[100vh] md:min-w-[100vw] md:min-h-[100vh] bg-accent-alt mb-8 md:mb-[100vh] 1-100">
        <div className="md:h-[100vh] ">
          {isSmallScreen && (
            <div className="h-[calc(100vh)]">
              <div
                className={`h-full ${!isAutoplaying ? 'visible' : 'hidden'} `}
              >
                <Image
                  className="w-full h-full object-cover"
                  src="/images/lios-fallback.jpg"
                  width={731}
                  height={786}
                  alt="Lios labs"
                />
              </div>
              <video
                ref={videoRef}
                loop={true}
                muted={true}
                autoPlay={true}
                playsInline={true}
                className={`w-full h-full object-cover ${
                  isAutoplaying ? 'visible' : 'hidden'
                } `}
              >
                <source
                  src="https://cdn.oasa.co/video/lios-small.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          )}
          {!isSmallScreen && (
            <YoutubeEmbed isBackgroundVideo={true} embedId="8XrtA7R1aew" />
          )}
        </div>
        <div className="absolute left-0 top-0 w-full h-full bg-black/20 flex justify-center z-1000">
          <div className="w-full flex justify-center flex-col items-center ">
            <div className=" md:w-full md:max-w-6xl p-6 md:p-4 flex flex-col items-center gap-2 md:gap-10">
              <Image
                className="drop-shadow-sm"
                src="/images/sygnet.png"
                width={350}
                height={350}
                alt="Lios labs"
              />
              <Heading
                className=" pl-8 !leading-[65px] mb-4 text-2xl md:text-[60px] normal-case font-accent-alt text-white drop-shadow-md"
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

      <div className="relative top-[105vh]">
        <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
          <div className="text-accent-alt">
            <Heading
              level={2}
              display
              className="text-center mb-6 md:text-[45px] normal-case leading-[50px]"
            >
              Join the wild faculty of transformation <br />
              <br />
              Dołącz do dzikiego fakultetu transformacji!
            </Heading>
            <p className="mb-6">
              Come and stay in our desert village and let your imagination roam
              freely. Get a chance to learn about local ecosystems, regenerative
              cultures, transition design, and practice agency in a playful way.
            </p>{' '}
            <p className="mb-6">
              You’ll have the opportunity to immerse in communal experiences
              while surrounded by the unique ecosystem of Błędowska Desert. We
              encourage you to be open to adventurous conditions and let them
              transform you, to embrace the raw beauty and complexity of Nature.
            </p>
            <p className="mb-6">
              We guarantee you’ll meet some inspiring creatures you’ll become
              friends with. You will have a chance to join workshops and
              experiments merging art, ecology, system thinking and science. If
              this invitation sounds like something for you, there are plenty of
              ways to get involved. Follow the dusty trail.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p className="mb-6">
              Przyjedź i zatrzymaj się w naszej pustynnej wiosce. Pozwól swojej
              wyobraźni swobodnie wędrować. Skorzystaj z okazji, aby w ciekawy i
              zabawny sposób poznać lokalne ekosystemy, praktyki kulturotwórcze
              i regeneratywne, a także praktykować sprawczość.
            </p>{' '}
            <p className="mb-6">
              Będzie to okazja do zanurzenia się we wspólnych doświadczeniach w
              otoczeniu unikalnego ekosystemu Pustyni Błędowskiej. Zachęcamy Cię
              do otwarcia się na warunki pełne przygód i pozwolenie im, aby Cię
              przemieniły i pokazały surowe piękno oraz złożoność otaczającej
              przyrody.
            </p>
            <p className="mb-6">
              Gwarantujemy, że spotkasz inspirujące stworzenia, z którymi się
              zaprzyjaźnisz. Będzie to sposobność do wzięcia udziału w
              warsztatach i eksperymentach łączących sztukę, ekologię, myślenie
              systemowe i naukę. Jeśli to zaproszenie brzmi jak coś dla Ciebie,
              istnieje wiele sposobów, aby się zaangażować. Podążaj piaszczystym
              szlakiem.
            </p>
          </div>
        </section>

        <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
          <div className="flex flex-col gap-4 text-accent-alt">
            <Heading
              level={2}
              display
              className="text-left mb-6 md:text-2xl normal-case"
            >
              Before the wild adventure begins... please read our Desert Values
              /<br />
              Zanim rozpocznie się dzika przygoda, przeczytaj proszę nasze
              Pustynne Wartości
            </Heading>
            <p>
              Desert Transformation Lab is shaped by shared ethics: equity of
              all beings, awareness, ecology, care, queerness, wholeness,
              non-violence, community, and sustainability. What does it mean in
              practice?
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Pustynne Laboratorium Transformacji kształtuje się poprzez wspólne
              wartości: równość wszystkich istot, świadomość, ekologia, troska,
              różnorodność, całość, niestosowanie przemocy, społeczność i
              zrównoważony rozwój. Co to oznacza w praktyce?
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Active Participation / <br />
              Aktywna partycypacja
            </Heading>
            <p>
              We know that transformative change can occur only through deeply
              personal participation - on individual, collective, and societal
              levels. We encourage you to embrace learning by doing. Everyone is
              invited to work for the common good of our planet and its
              inhabitants. All participants are involved in the daily routine of
              the village and are asked to comply with the{' '}
              <Link
                className="text-accent no-underline"
                href="https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link"
              >
                Desert Guidelines
              </Link>
              .
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Wierzymy, że transformacyjne zmiany mogą nastąpić tylko poprzez
              głębokie zaangażowanie - na poziomie indywidualnym, kolektywnym i
              społecznym. Zachęcamy do uczenia się poprzez działanie. Każda
              osoba jest zaproszona do pracy na rzecz wspólnego dobra, naszej
              planety i zamieszkujących ją istot. Wszystkie osoby uczestniczące
              biorą udział w codziennych zajęciach wioski i proszone są o
              przestrzeganie{' '}
              <Link
                className="text-accent no-underline"
                href="https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link"
              >
                Pustynnych Wartości
              </Link>
              .
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Sustainability / <br />
              Ekologia & Zrównoważony Rozwój
            </Heading>
            <p>
              Sustainability lies at the core of Desert Transformation Lab and
              we wish to incorporate it into our daily practice. The residency
              is an ideal ecosystem for developing new habits and rethinking
              their impact on the natural environment. Create a positive trace:
              We are a regenerative playground. Come and leave a mark that
              future generations will appreciate.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Praktyki ekologiczne leżą u podstaw Laboratorium Pustynnej
              Transformacji i włączamy je w naszą codzienność. Pobyt na Pustyni
              jest idealnym ekosystemem do rozwijania nowych nawyków i ponownego
              przemyślenia ich wpływu na środowisko naturalne. Stwórzmy
              pozytywny ślad: Jesteśmy regeneratywnym placem zabaw. Przyjedź i
              zostaw po sobie coś, co docenią przyszłe pokolenia.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Consent / <br />
              Zgoda
            </Heading>
            <p>
              Bring awareness to your boundaries & needs, respect those of
              others. If it’s not a full yes, then it’s a no.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Zadbaj o swoje granice i potrzeby, szanuj granice i potrzeby
              innych osób. Jeśli to nie jest pełne &quot;tak&quot;, to jest to
              &quot;nie&quot;.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Radical Self-Reliance /<br />
              Radykalna Samowystarczalność
            </Heading>
            <p>
              When you come to the Desert Transformation Lab, you are
              responsible for your own survival, safety, comfort, and well-being
              of yourself and the village.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Kiedy przyjedziesz do Laboratorium Pustynnego Wyobraźni, weź
              odpowiedzialność za siebie, swoje bezpieczeństwo, komfort oraz
              dobrobyt własny i wioski. Jeśli widzisz, że coś jest do zrobienia
              to znaczy, że jest to Twoje zadanie.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Gift Economy / <br />
              Ekonomia Daru
            </Heading>
            <p>
              What is your deepest gift that you can share with the community?
              How we can collectively practice non-capitalistic forms of
              exchange that are based on mutual care?
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Jaki jest Twój najgłębszy dar, którym chcesz podzielić się z
              społecznością? Jak możemy wspólnie praktykować formy wymiany
              oparte na wzajemnej trosce, a nie na modelach kapitalistycznych?
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Decommodification / <br />
              Dekomercjalizacja
            </Heading>
            <p>
              To preserve the spirit of gifting, our community seeks to create
              social environments that are unmediated by commercial
              sponsorships, transactions, or advertising. We stand ready to
              protect our culture from such exploitation. We resist the
              substitution of consumption for participatory experience.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Aby zachować ducha dawania, nasza społeczność stara się tworzyć
              środowiska społeczne, które są pozbawione komercyjnych partnerstw,
              transakcji lub reklam. Chcemy chronić naszą kulturę przed taką
              eksploatacją. Wesprzyj nas w tym dążeniu!
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Communal Effort / <br />
              Kolektywny Wysiłek
            </Heading>
            <p>
              Our community values creative cooperation and collaboration. We
              strive to produce, promote and protect social networks, public
              spaces, works of art, and methods of communication that support
              such interaction.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Nasza społeczność ceni twórczą współpracę i kolaborację. Staramy
              się wytwarzać, promować i chronić sieci społeczne, przestrzenie
              publiczne, dzieła sztuki oraz metody komunikacji, które wspierają
              takie interakcje.
            </p>

            <Heading level={4} display className="mt-6 md:text-xl normal-case ">
              Ecological Awareness / <br />
              Świadomość Ekologiczna
            </Heading>
            <p>
              Desert Transformation Lab is nested in Eagle’s Nest Landscape
              Park, within the dunes of Błędowska Desert, an ecosystem that is
              part of the Natura 2000 protection program. You are invited to
              meet our neighbours, human and more than human, and please be
              respectful and aware that their needs may be different from yours.
            </p>
            <div className="flex justify-center mb-4 mt-2">
              <div className="border-t w-[120px] border-accent-alt"></div>
            </div>
            <p>
              Pustynne Laboratorium Transformacji jest osadzone w Parku
              Krajobrazowym Orlich Gniazd, w obrębie wydm Pustyni Błędowskiej,
              ekosystemie będącym częścią programu ochrony Natura 2000.
              Zapraszamy Cię do spotkania się z naszymi sąsiadami, ludźmi i
              innymi istotami, prosimy jednak o szacunek i świadomość, że ich
              potrzeby mogą się różnić od Twoich.
            </p>
          </div>
        </section>

        <section className="mb-12 max-w-4xl mx-auto md:pt-8 md:flex justify-center">
          <div className="flex gap-4 flex-col sm:flex-row">
            <LinkButton href="/stay" className="lowercase">
              apply to stay
            </LinkButton>
          </div>
        </section>

        <section className="mb-12 max-w-4xl mx-auto md:pt-20 md:flex justify-center">
          <Hosts hosts={hosts} email={TEAM_EMAIL} />
        </section>

        <section className="w-[100vw] -mx-4 min-h-[600px] py-10  md:flex justify-center bg-[url(/images/lios-bg.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-4 max-w-4xl px-4">
            <Heading
              level={2}
              className="text-2xl mb-8 max-w-prose text-white "
            >
              {__('stay_chose_accommodation', appName)}
            </Heading>
            <div className="flex justify-center">
              {listings && listings.count() > 0 && (
                <div className="grid md:grid-cols-3 gap-x-12 md:gap-x-5 gap-y-8">
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

        <section className="min-h-[600px] w-[100vw] -mx-4 px-4  pt-20 pb-10 flex justify-center bg-[url(/images/lios-bg-2.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-8 items-center ">
            <Heading level={2} className="text-6xl text-center">
              HOW TO PLAY
            </Heading>
            <Heading level={3} className="font-body mb-8 text-lg text-center">
              DESERT ROLES & ARCHETYPES
            </Heading>

            <div className="max-w-4xl">
              <div className="flex-col md:flex-row flex gap-24 justify-between text-accent">
                <div className="flex flex-col gap-12 items-center">
                  <Heading level={4} className="text-lg uppercase">
                    Desert guide
                  </Heading>
                  <p className="text-center">
                    Become one of the caretakers and facilitators of the Desert
                    Transformation Lab and guide others through this wild
                    faculty.
                  </p>
                  <p className="font-accent uppercase">Applications closed</p>
                </div>
                <div className="flex flex-col gap-12 items-center">
                  <Heading level={4} className="text-lg uppercase">
                    Participant
                  </Heading>
                  <p className="text-center">
                    Visit and study at the School of Ecological Imagination,
                    experience communal living in a unique ecosystem and get
                    involved in something bigger than yourself.
                  </p>
                  <LinkButton href="/stay" className="w-[150px]">
                    Join
                  </LinkButton>
                </div>
                <div className="flex flex-col gap-12 items-center">
                  <Heading level={4} className="text-lg uppercase">
                    Volunteer
                  </Heading>
                  <p className="text-center">
                    Join the our Desert troupe as one of the Special Agents in
                    the area of your choosing and become a part of the
                    transformation.
                  </p>
                  <p className="font-accent uppercase">Applications closed</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 pt-12">
                <Link
                  className="font-accent uppercase text-accent"
                  href="https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link"
                >
                  DESERT GUIDELINES - PDF
                </Link>
                <Image
                  src="/images/lios-logo-sm.png"
                  alt="Lios Labs logo"
                  width={90}
                  height={90}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-[600px] w-[100vw] -mx-4 pt-12 pb-10 px-4 md:flex justify-center bg-neutral">
          <div className="flex flex-col gap-8 items-center">
            <Image
              src="/images/planetary-movement.png"
              alt="Lios planetary movement"
              width={380}
              height={342}
            />

            <Heading level={2} className="text-2xl uppercase text-center">
              Desert Transformation lab
            </Heading>

            <LinkButton
              href="https://lios.io/deserttransformation"
              className="w-[150px]"
            >
              Website
            </LinkButton>
            <LinkButton href="https://lios.io/program" className="w-[250px]">
              PROGRAMME OUTLINE
            </LinkButton>
          </div>
        </section>

        <section className="min-h-[600px] h-[700px] overflow-scroll w-[100vw] -mx-4 px-4  pt-12 pb-20 flex justify-center bg-[url(/images/lios-faq.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-8 items-center w-full sm:w-[600px] ">
            <Faqs faqs={faqs} error={error} isExpanded />
          </div>
        </section>

        <section className=" w-[100vw] -mx-4 px-4  pt-12 pb-20 flex justify-center">
          <div className="flex flex-col gap-8 items-center w-full sm:w-[600px] ">
            <Link
              className="font-accent uppercase text-accent"
              href="https://lios.io/deserttransformation"
            >
              DESERT TRANSFORMATION LAB Website
            </Link>
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
