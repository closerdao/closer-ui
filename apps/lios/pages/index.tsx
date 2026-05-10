import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import Hosts from 'closer/components/Hosts';

import {
  BookingConfig,
  Card,
  GeneralConfig,
  Heading,
  getCachedConfig,
  useAuth,
  useConfig,
  usePlatform,
} from 'closer';
import { useFaqs } from 'closer/hooks/useFaqs';
import { parseMessageFromError } from 'closer/utils/common';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
  bookingSettings: BookingConfig | null;
}

const HomePage = ({ generalConfig, bookingSettings }: Props) => {
  const t = useTranslations();
  const router = useRouter();

  const { APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};

  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);
  const appName = APP_NAME && APP_NAME?.toLowerCase();

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

  const CTA = (
    <Link
      href="/learn/category/all"
      type="submit"
      className=" font-accent  lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
    >
      {t('navigation_see_courses')}
    </Link>
  );

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="School of Ecological Imagination" />
      </Head>
      <section className="w-[100vw] md:w-[calc(100vw+16px)] -mx-4 absolute -top-2 overflow-hidden md:left-0 h-[400px] md:h-[calc(100vh-60px)] md:min-w-[100vw] md:min-h-[calc(100vh-60px)] bg-accent-alt mb-8 md:mb-[calc(100vh-60px)] 1-100">
        <div className="w-full h-full relative">
          <Image
            className="w-full h-full object-cover relative"
            src="/images/landing/SOEI_Header.png"
            width={731}
            height={786}
            alt="Lios labs"
            quality={87}
          />
        </div>
        {/* <div className="min-w-[100vw] min-h-[110vh] w-[calc(100vh+100vh)] h-[calc(100vh+20vw)] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
          {!isSmallScreen && (
            <div className="h-[calc(100vh)]">
              <div
               
              >
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
        </div> */}
        <div className="absolute left-0 top-0 w-full h-full bg-black/20 flex justify-center z-1000">
          <div className="w-full flex justify-center flex-col items-center ">
            <div className=" md:w-full md:max-w-6xl p-6 md:py-10 flex flex-col items-end gap-2 justify-end md:gap-10 h-full py-10">
              {/* <Image
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
              </Heading> */}

              <div className="justify-center w-full flex  pb-[5vh] md:pb-[calc(20vh)]">
                {CTA}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative top-[440px] md:top-[calc(100vh-60px)]">
        <section className="max-w-3xl mx-auto md:pt-12 md:flex ">
          <div className="text-accent-alt">
            {router.locale === 'en' && (
              <div>
                <Heading
                  level={2}
                  display
                  className="text-center mb-6 md:text-[45px] normal-case leading-[50px]"
                >
                  Welcome to the School of Ecological Imagination!
                </Heading>
                <p className="mb-6">
                  The School of Ecological Imagination is a portal for
                  (un)learning, transformative experiences and reconnecting with
                  ourselves, our more-than-human kin, and planetary rhythms.
                </p>{' '}
                <p className="mb-6">
                  At SoEI, we shed the pursuit of control and mastery, instead
                  approaching education as a process of mutually engaged
                  curiosity, symbiotic resonance, and playful experimentation.
                  Through embodied, transdisciplinary, polyrhythmic collective
                  experiences, we cultivate ecological awareness, attune with
                  biospheric pulses, and wander alternative paths of being and
                  becoming.
                </p>
                <p className="mb-6">
                  Within the circles of the School, we learn to think, feel,
                  move, and imagine with the vitality of the animate earth,
                  supporting healing and wholing, and developing the tools to
                  navigate the polycrisis.
                </p>
                <p className="mb-6">
                  We tend a momentary garden of ecological wisdom, personal
                  development, and creative practice - providing accessible and
                  engaging pathways for learners to imagine narratives of
                  earthly flourishing, and embody them.
                </p>
              </div>
            )}
            {router.locale === 'pl' && (
              <div>
                <Heading
                  level={2}
                  display
                  className="text-center mb-6 md:text-[45px] normal-case leading-[50px]"
                >
                  Dołącz do dzikiego fakultetu transformacji!
                </Heading>
                <p className="mb-6">
                  Przyjedź i zatrzymaj się w naszej pustynnej wiosce. Pozwól
                  swojej wyobraźni swobodnie wędrować. Skorzystaj z okazji, aby
                  w ciekawy i zabawny sposób poznać lokalne ekosystemy, praktyki
                  kulturotwórcze i regeneratywne, a także praktykować
                  sprawczość.
                </p>{' '}
                <p className="mb-6">
                  Będzie to okazja do zanurzenia się we wspólnych
                  doświadczeniach w otoczeniu unikalnego ekosystemu Pustyni
                  Błędowskiej. Zachęcamy Cię do otwarcia się na warunki pełne
                  przygód i pozwolenie im, aby Cię przemieniły i pokazały surowe
                  piękno oraz złożoność otaczającej przyrody.
                </p>
                <p className="mb-6">
                  Gwarantujemy, że spotkasz inspirujące stworzenia, z którymi
                  się zaprzyjaźnisz. Będzie to sposobność do wzięcia udziału w
                  warsztatach i eksperymentach łączących sztukę, ekologię,
                  myślenie systemowe i naukę. Jeśli to zaproszenie brzmi jak coś
                  dla Ciebie, istnieje wiele sposobów, aby się zaangażować.
                  Podążaj piaszczystym szlakiem.
                </p>
              </div>
            )}
          </div>
        </section>

        {router.locale === 'en' && (
          <>
            <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
              <div className="flex flex-col gap-4 text-accent-alt">
                <Heading
                  level={2}
                  display
                  className="text-left mb-6 md:text-2xl normal-case"
                >
                  The School of Ecological Imagination: Guiding Principles 🌿
                </Heading>
                <p>
                  At the heart of the School of Ecological Imagination lies a
                  deep commitment to re-enchanting the world and reimagining how
                  we learn, live, and create together. Our values are rooted in
                  reciprocity, regeneration, and ecosystem well-being. Radical
                  optimism, active hope and compassionate inquiry are prisms and
                  methods through which we approach transformation. Through our
                  initiatives we seek to better understand how to serve Life
                  through building common spaces for ecological education.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌟 Community as the pedagogical Body
                </Heading>
                <p>
                  We see the School as a nest woven from the threads of
                  curiosity, trust and shared meaning. The space and its
                  processes are held by and for those at the edges—queer, BIPOC,
                  femme, marginalised, intergenerational voices—all teaching,
                  learning, and supporting each other inviting relational forms
                  of exchange and co-creation . &lt;3
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌱 (Un)learning and Reimagining
                </Heading>
                <p>
                  We challenge dominant paradigms, unlearn biases, and expand
                  what education can be. Through peer-to-peer (un)learning and
                  open curiosity, we nurture growth and invite a world of
                  possibilities.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌍 Interconnectedness
                </Heading>
                <p>
                  Every being, element, and ecosystem is woven into a greater
                  whole. Our work honours this intrinsic connection, listening
                  to the earth and its more-than-human voices as our teachers.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🎭 Art and Creativity
                </Heading>
                <p>
                  The arts are our language for healing, imagining, and
                  meaning-making. Through movement, storytelling, and ecological
                  practices, we cultivate creative expressions that shift
                  perspectives and envision radically optimistic futures.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  ✨ Re-Enchantment and Wonder
                </Heading>
                <p>
                  We seek to rediscover the sacredness in the everyday and the
                  magick within the natural world. This sense of wonder inspires
                  us to see life anew and act with care.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌊 Playfulness and Joy
                </Heading>
                <p>
                  Learning is joyful, curious, and playful. We embrace the art
                  of play as a way to deepen ecological literacy and create
                  life-serving practices.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌀 Holistic Education
                </Heading>
                <p>
                  True learning nourishes the whole self—mind, body, heart, and
                  spirit. By bridging intellectual knowledge, natural wisdom
                  with embodied, collective practices, we invite transformative
                  change.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌟 Inclusivity and Queering
                </Heading>
                <p>
                  Through queering, we reject binaries and challenge restrictive
                  norms. We celebrate diversity in all its forms and create
                  spaces of belonging for people and the more-than-human world.
                </p>
                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌿 Regeneration and Healing
                </Heading>
                <p>
                  Our practices reflect reciprocity and care, fostering
                  ecological restoration and mending broken relationships with
                  the Earth. Healing and wholeness guide us toward a just and
                  sustainable future.
                </p>
                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🔄 Embracing Change
                </Heading>
                <p>
                  As Octavia Butler reminds us, &quot;Everything you touch, you
                  change. All that you change, changes you.&quot; Change is a
                  constant, and we adapt with it, listening, learning, and
                  evolving alongside the earth and each other.
                </p>
                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🔥 Commoning Knowledge
                </Heading>
                <p>
                  We believe in sharing knowledge and skills freely, where
                  everyone is a teacher and a student. There are no experts—just
                  a wiggly web of collective wisdom.
                </p>
                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  🌌 Transparency and Care
                </Heading>
                <p>
                  The process of creation is open, evolving, and intentional.
                  Together, we cultivate a culture of care—caring for ourselves,
                  each other, and the earth, with equity and sustainability at
                  the core.
                </p>
                <p>
                  The School of Ecological Imagination is a living system,
                  co-created by all who join it. Together, we yarn art, ecology,
                  queerness, magic, science, and spirituality into pathways of
                  expanded perception and action, always grounded in equity,
                  awareness, and love.
                </p>
                <p>
                  Welcome to this shared journey of becoming, blooming, and
                  belonging.
                </p>
              </div>
            </section>
          </>
        )}

        {router.locale === 'pl' && (
          <>
            <section className="mb-12 max-w-3xl mx-auto md:pt-12 md:flex ">
              <div className="flex flex-col gap-4 text-accent-alt">
                <Heading
                  level={2}
                  display
                  className="text-left mb-6 md:text-2xl normal-case"
                >
                  Zanim rozpocznie się dzika przygoda, przeczytaj proszę nasze
                  Pustynne Wartości
                </Heading>

                <p>
                  Pustynne Laboratorium Transformacji kształtuje się poprzez
                  wspólne wartości: równość wszystkich istot, świadomość,
                  ekologia, troska, różnorodność, całość, niestosowanie
                  przemocy, społeczność i zrównoważony rozwój. Co to oznacza w
                  praktyce?
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Aktywna partycypacja
                </Heading>

                <p>
                  Wierzymy, że transformacyjne zmiany mogą nastąpić tylko
                  poprzez głębokie zaangażowanie - na poziomie indywidualnym,
                  kolektywnym i społecznym. Zachęcamy do uczenia się poprzez
                  działanie. Każda osoba jest zaproszona do pracy na rzecz
                  wspólnego dobra, naszej planety i zamieszkujących ją istot.
                  Wszystkie osoby uczestniczące biorą udział w codziennych
                  zajęciach wioski i proszone są o przestrzeganie{' '}
                  <Link
                    className="text-accent no-underline"
                    href="https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link"
                  >
                    Pustynnych Wartości
                  </Link>
                  .
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Ekologia & Zrównoważony Rozwój
                </Heading>

                <p>
                  Praktyki ekologiczne leżą u podstaw Laboratorium Pustynnej
                  Transformacji i włączamy je w naszą codzienność. Pobyt na
                  Pustyni jest idealnym ekosystemem do rozwijania nowych nawyków
                  i ponownego przemyślenia ich wpływu na środowisko naturalne.
                  Stwórzmy pozytywny ślad: Jesteśmy regeneratywnym placem zabaw.
                  Przyjedź i zostaw po sobie coś, co docenią przyszłe pokolenia.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Zgoda
                </Heading>

                <p>
                  Zadbaj o swoje granice i potrzeby, szanuj granice i potrzeby
                  innych osób. Jeśli to nie jest pełne &quot;tak&quot;, to jest
                  to &quot;nie&quot;.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Radykalna Samowystarczalność
                </Heading>

                <p>
                  Kiedy przyjedziesz do Laboratorium Pustynnego Wyobraźni, weź
                  odpowiedzialność za siebie, swoje bezpieczeństwo, komfort oraz
                  dobrobyt własny i wioski. Jeśli widzisz, że coś jest do
                  zrobienia to znaczy, że jest to Twoje zadanie.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Ekonomia Daru
                </Heading>

                <p>
                  Jaki jest Twój najgłębszy dar, którym chcesz podzielić się z
                  społecznością? Jak możemy wspólnie praktykować formy wymiany
                  oparte na wzajemnej trosce, a nie na modelach
                  kapitalistycznych?
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Dekomercjalizacja
                </Heading>

                <p>
                  Aby zachować ducha dawania, nasza społeczność stara się
                  tworzyć środowiska społeczne, które są pozbawione komercyjnych
                  partnerstw, transakcji lub reklam. Chcemy chronić naszą
                  kulturę przed taką eksploatacją. Wesprzyj nas w tym dążeniu!
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Kolektywny Wysiłek
                </Heading>

                <p>
                  Nasza społeczność ceni twórczą współpracę i kolaborację.
                  Staramy się wytwarzać, promować i chronić sieci społeczne,
                  przestrzenie publiczne, dzieła sztuki oraz metody komunikacji,
                  które wspierają takie interakcje.
                </p>

                <Heading
                  level={4}
                  display
                  className="mt-6 md:text-xl normal-case "
                >
                  Świadomość Ekologiczna
                </Heading>

                <p>
                  Pustynne Laboratorium Transformacji jest osadzone w Parku
                  Krajobrazowym Orlich Gniazd, w obrębie wydm Pustyni
                  Błędowskiej, ekosystemie będącym częścią programu ochrony
                  Natura 2000. Zapraszamy Cię do spotkania się z naszymi
                  sąsiadami, ludźmi i innymi istotami, prosimy jednak o szacunek
                  i świadomość, że ich potrzeby mogą się różnić od Twoich.
                </p>
              </div>
            </section>
          </>
        )}

        {/* <section className="mb-12 max-w-4xl mx-auto md:pt-8 md:flex justify-center">
          <div className="flex gap-4 flex-col sm:flex-row">
            <LinkButton href="/stay" className="lowercase">
              Participate / dołącz
            </LinkButton>
          </div>
        </section> */}

        <section className="mb-12 max-w-4xl mx-auto md:pt-20 md:flex justify-center">
          <Hosts hosts={hosts} email={TEAM_EMAIL} />
        </section>

        {/* Archived accommodation selector: */}
        {/* <section className="w-[100vw] -mx-4 min-h-[600px] py-10  md:flex justify-center bg-[url(/images/lios-bg.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-4 max-w-4xl px-4">
            <Heading
              level={2}
              className="text-2xl mb-8 max-w-prose text-white "
            >
              {t('stay_chose_accommodation', appName)}
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
              {listings?.count() === 0 && t('listing_no_listings_found')}
            </div>
          </div>
        </section> */}

        <section className="w-[100vw] -mx-4 min-h-[600px] py-10 pb-20 md:flex justify-center bg-neutral">
          <div className="flex flex-col gap-6 max-w-4xl px-4">
            <Heading level={2} className="text-2xl mb-8 max-w-prose ">
              Choose your path
            </Heading>
            <div className="flex justify-center gap-6 flex-col sm:flex-row">
              <Card className="bg-white flex-1 justify-start">
                <Heading level={4} className="text-lg uppercase">
                  Petals
                </Heading>
                <p>
                  <strong className="font-bold">
                    Single session €15 per session.
                  </strong>
                </p>
                <p>Stop by for a single session whiff of a course</p>
              </Card>
              <Card className="bg-white flex-1 justify-start">
                <Heading level={4} className="text-lg uppercase">
                  Seeds{' '}
                </Heading>
                <p>
                  <strong className="font-bold">
                    Individual Course sign up €60/ per course 4-8 Sessions
                  </strong>
                </p>
                <p>
                  This is a fixed course price to cover facilitation costs. If
                  this is a barrier to access the course, please email us{' '}
                  <a href="mailto:unlearn@lios.io">unlearn@lios.io</a> to
                  arrange a subsided place. These are limited and come on a
                  first come first serve basis.{' '}
                </p>
              </Card>
              {/* <Card className="bg-white flex-1 justify-start">
                <Heading level={4} className="text-lg uppercase">
                  Berries{' '}
                </Heading>
                <p>
                  <strong className="font-bold">
                    Individual Course sign up €80/ per course 12 Sessions{' '}
                  </strong>
                </p>
                <p>
                  This is a fixed course price to cover facilitation costs. If
                  this is a barrier to access the course, please email us{' '}
                  <a href="mailto:unlearn@lios.io">unlearn@lios.io</a> to
                  arrange a subsided place. These are limited and come on a
                  first come first serve basis.{' '}
                </p>
              </Card> */}
            </div>
            <div className="flex justify-center gap-6 flex-col sm:flex-row">
              <Card className="bg-white flex-1 justify-start ">
                <Heading level={4} className="text-lg uppercase">
                  Carrier Bag{' '}
                </Heading>
                <p>
                  <strong className="font-bold">
                    Verein Member - Annual - Standard Rate - €111 / year
                  </strong>
                </p>
                <p>
                  Full access to all the courses, recordings, and discussion
                  boards and the ability to propose LIOS projects.
                </p>
              </Card>
              <Card className="bg-white flex-1 justify-start">
                <Heading level={4} className="text-lg uppercase">
                  Sacred Vessel{' '}
                </Heading>
                <p>
                  <strong className="font-bold">
                    Angel Rate - Verein Membership - € 222 / year
                  </strong>
                </p>
                <p>
                  Your extra support for LIOS helps keep our programming
                  evolving and accessible for more people! Full access to all
                  courses, recordings and discussion boards and the ability to
                  propose LIOS projects.
                </p>
              </Card>
            </div>
            <div className="w-[200px]">{CTA}</div>
          </div>
        </section>

        {/* <section className="min-h-[600px] w-[100vw] -mx-4 px-4  pt-20 pb-10 flex justify-center bg-[url(/images/lios-bg-2.jpg)] bg-cover bg-center">
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
                    {t('buttons_join')}
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
        </section> */}

        {/* <section className="min-h-[600px] w-[100vw] -mx-4 pt-12 pb-10 px-4 md:flex justify-center bg-neutral">
          <div className="flex flex-col gap-8 items-center">
            <Image
              src="/images/planetary-movement.png"
              alt="Lios planetary movement"
              width={380}
              height={342}
            />

            <Heading level={2} className="text-2xl uppercase text-center">
              School of Ecological Imagination
            </Heading>

            <LinkButton
              href="https://lios.io/deserttransformation"
              className="w-[150px]"
            >
              {t('buttons_website')}
            </LinkButton>
            <LinkButton href="https://lios.io/program" className="w-[250px]">
              {t('buttons_programme_outline')}
            </LinkButton>
          </div>
        </section> */}

        {/* <section className="min-h-[600px] h-[700px] overflow-scroll w-[100vw] -mx-4 px-4  pt-12 pb-20 flex justify-center bg-[url(/images/lios-faq.jpg)] bg-cover bg-center">
          <div className="flex flex-col gap-8 items-center w-full sm:w-[600px] ">
            <Faqs faqs={faqs} error={error} isExpanded />
          </div>
        </section> */}

        <section className=" w-[100vw] -mx-4 px-4  pt-20 flex justify-center">
          <div className="flex flex-col gap-8 items-center w-full sm:w-[600px] ">
            <Link
              className="font-accent uppercase text-accent"
              href="https://lios.io/deserttransformation"
            >
              Desert Transformation Lab Website
            </Link>
          </div>
        </section>

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const bookingSettings = getCachedConfig('booking');
    const generalConfig = getCachedConfig('general');

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
