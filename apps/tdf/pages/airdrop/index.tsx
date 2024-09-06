import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import BulletChecked from 'closer/components/icons/BulletChecked';
import BulletUnChecked from 'closer/components/icons/BulletUnChecked';
import { Heading, LinkButton } from 'closer/components/ui';

import { useAuth } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const AirdropPage = () => {
  const { user } = useAuth();
  const qualifiers = user && user.stats && user.stats.airdrop_20230621_20240630;

  return (
    <>
      <Head>
        <title>$TDF AIRDROP</title>
        <meta name="description" content="" />
        <meta property="og:type" content="event" />
      </Head>

      <main className="pt-4 pb-24 md:flex-row flex-wrap max-w-6xl mx-auto">
        <section className="mb-10">
          <div className='rounded-lg min-h-[300px] h-[calc(100vh-190px)]  flex justify-center items-center flex-col bg-center bg-accent bg-cover bg-no-repeat text-white bg-[url("/images/airdrop-hero.jpg")]'>
            <div className="flex flex-col items-center">
              <Heading
                level={1}
                className=" font-extrabold normal-case sm:uppercase text-4xl md:text-7xl px-4 drop-shadow-lg mb-2 md:mb-4 md:text-center max-w-[700px]"
              >
                $TDF Airdrop
              </Heading>
              <Heading
                level={2}
                className="normal-case sm:uppercase  md:text-center px-4 text-lg md:text-md max-w-[700px] font-normal mb-4"
              >
                Summer solstice, 2024
              </Heading>

              {user && !user.walletAddress && (
                <LinkButton
                  className=" font-bold mt-8 sm:px-8 px-3 text-md sm:text-lg"
                  type="primary"
                  isFullWidth={false}
                  href={`/members/${user.slug}`}
                >
                  Connect wallet to qualify
                </LinkButton>
              )}
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mt-20 mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold sm:font-extrabold  normal-case text-center mt-12 max-w-[620px] mb-10 text-lg  sm:text-xl"
              >
                In the spirit of gifting and Web3 at TDF
                <p className="text-accent text-2xl sm:text-5xl">
                  We’re doing an Airdrop!
                </p>
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <p>
                  TDF has applied for a non-refundable grant through the
                  Portugal 2030 program that would cover 60% of the build costs
                  of our co-living, including water works, 14 suites, a pool, a
                  lake, and 2 agroforestry terraces; with a total budget of
                  €914.805.{' '}
                </p>
                <p>
                  To reach the 40% equity, we aim for €150K in new token sales.
                  If you’re considering buying $TDF tokens, get ‘em by 31 July
                  2024 to help qualify for the grant. It’s an ideal time since
                  each token has more than double the impact thanks to the
                  grant.
                </p>
              </div>
              <LinkButton href="/token" type="secondary" className="w-[200px]">
                buy $tdf tokens
              </LinkButton>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold text-2xl uppercase text-center mt-12 max-w-[620px] mb-10 sm:text-5xl sm:font-extrabold md:normal-case"
              >
                WHAT IS AN AIRDROP?
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <p>
                  Airdrops are a popular way to reward participation in the
                  crypto space.
                </p>
                <p>
                  At TDF we’re using this as a way to  send gifts for past
                  visits, volunteering, governance participation, and wallets
                  interacting with the TDF token.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold text-2xl uppercase text-center mt-12 max-w-[620px] mb-10 sm:text-5xl sm:font-extrabold md:normal-case"
              >
                WHY AN AIRDROP NOW?
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <p>
                  We want to provide a playful way for people to to learn and
                  experiment with how to use this new, decentralised tech for
                  regeneration. 🌱
                </p>
                <p>
                  Being rewarded in an airdrop of gifts ($CELO, $TDF, Carrots
                  🥕) for being part of our community is a fun way to do so.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold text-2xl uppercase text-center mt-12 max-w-[620px] mb-10 sm:text-5xl sm:font-extrabold md:normal-case"
              >
                QUALIFIERS{' '}
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <ul className="flex flex-col gap-6">
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {user && user.walletAddress ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div>
                        <Heading
                          level={3}
                          className="text-md uppercase font-bold -mt-0.5"
                        >
                          have your wallet connected
                        </Heading>
                        {user && !user.walletAddress && (
                          <LinkButton
                            className=" font-bold mt-8 px-8"
                            type="secondary"
                            isFullWidth={false}
                            href={`/members/${user?.slug}`}
                          >
                            Connect wallet
                          </LinkButton>
                        )}
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.presence > 0 ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Presence, <span className="text-accent">30%</span>
                        </Heading>

                        <p className="text-sm">
                          Number of nights spent - as in confirmed bookings
                          through the platform
                        </p>
                        {qualifiers && !qualifiers.presence && (
                          <LinkButton
                            className=" font-bold mt-8 px-8"
                            type="secondary"
                            isFullWidth={false}
                            href="/stay"
                          >
                            Book a stay
                          </LinkButton>
                        )}
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      {qualifiers && qualifiers.tokensBought ? (
                        <BulletChecked />
                      ) : (
                        <BulletUnChecked />
                      )}

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          $TDF purchased,{' '}
                          <span className="text-accent">10%</span>
                        </Heading>
                        <p className="text-sm">Through the sale contract</p>

                        {qualifiers && !qualifiers.tokensBought && (
                          <LinkButton
                            className=" font-bold mt-8 px-8"
                            type="secondary"
                            isFullWidth={false}
                            href="/token"
                          >
                            Buy 1 or more $TDF
                          </LinkButton>
                        )}
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      {qualifiers && qualifiers.isVoter ? (
                        <BulletChecked />
                      ) : (
                        <BulletUnChecked />
                      )}

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Participated in governance on Snapshot,{' '}
                          <span className="text-accent">10%</span>
                        </Heading>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.volunteeringPresence ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Volunteering, <span className="text-accent">10%</span>
                        </Heading>
                        <p className="text-sm">
                          Staying at TDF and contributing work (min 2 weeks).
                        </p>

                        {qualifiers && !qualifiers.volunteeringPresence && (
                          <LinkButton
                            className=" font-bold mt-8 px-8"
                            type="secondary"
                            isFullWidth={false}
                            href="/volunteer"
                          >
                            Apply to volunteer
                          </LinkButton>
                        )}
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.socialShare ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Social mentions,{' '}
                          <span className="text-accent">10%</span>
                        </Heading>
                        <p className="text-sm">
                          Must submit a proof through{' '}
                          <Link
                            href="https://forms.gle/kLKKZw9km7a5oKHj8"
                            target="_blank"
                          >
                            this form
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </li>

                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.referrals ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Number of successful referrals to the platform,{' '}
                          <span className="text-accent">10%</span>
                        </Heading>
                        <p className="text-sm">Invite friends functionality</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.tickets ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Event participation,{' '}
                          <span className="text-accent">10%</span>
                        </Heading>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        {qualifiers && qualifiers.nominations ? (
                          <BulletChecked />
                        ) : (
                          <BulletUnChecked />
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Heading
                          level={3}
                          className=" text-md uppercase font-bold -mt-0.5"
                        >
                          Nominations, <span className="text-accent">10%</span>
                        </Heading>
                        <p className="text-sm">
                          Nominate folks you think contributed to TDF{' '}
                          <Link
                            href="https://forms.gle/EKTwgYgULnNcF6DH7"
                            target="_blank"
                          >
                            here
                          </Link>
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
                <p className="text-sm">
                  * Participants must have a Web3 wallet connected to the
                  platform to qualify for the airdrop.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold text-2xl uppercase text-center mt-12 max-w-[620px] mb-10 sm:text-5xl sm:font-extrabold md:normal-case"
              >
                REWARDS{' '}
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20 font-bold">
                <p className="flex items-center gap-4">
                  <Image
                    src="/images/tdf-logo-small.png"
                    alt=""
                    width={40}
                    height={40}
                  />
                  111 $TDF TOKENS
                </p>
                <p className="flex items-center gap-4">
                  <Image
                    src="/images/celo-logo-small.png"
                    alt=""
                    width={40}
                    height={40}
                  />
                  555 $CELO TOKENS
                </p>
                <p className="flex items-center gap-4">
                  <Image
                    src="/images/carrot.png"
                    alt=""
                    width={40}
                    height={40}
                  />
                  <span>
                    555 Carrots{' '}
                    <span className="font-normal">(expire after 1 year)</span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold text-2xl uppercase text-center mt-12 max-w-[620px] mb-10 sm:text-5xl sm:font-extrabold md:normal-case"
              >
                Schedule
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <ul className="flex flex-col gap-6">
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        <BulletChecked />
                      </div>

                      <Heading
                        level={3}
                        className="text-md uppercase font-bold -mt-0.5"
                      >
                        Summer Solstice{' '}
                        <span className="font-normal">
                          (for the 4 previous seasons), 2024
                        </span>
                        , <span className="text-accent">50%</span>
                      </Heading>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        <BulletChecked />
                      </div>

                      <Heading
                        level={3}
                        className="text-md uppercase font-bold -mt-0.5"
                      >
                        Fall Equinox, <span className="font-normal">2024</span>,{' '}
                        <span className="text-accent">12.5%</span>
                      </Heading>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        <BulletChecked />
                      </div>

                      <Heading
                        level={3}
                        className="text-md uppercase font-bold -mt-0.5"
                      >
                        Winter Solstice,{' '}
                        <span className="font-normal">2024</span>,{' '}
                        <span className="text-accent">12.5%</span>
                      </Heading>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        <BulletChecked />
                      </div>

                      <Heading
                        level={3}
                        className="text-md uppercase font-bold -mt-0.5"
                      >
                        Spring equinox,{' '}
                        <span className="font-normal">2025</span>,{' '}
                        <span className="text-accent">12.5%</span>
                      </Heading>
                    </div>
                  </li>
                  <li>
                    <div className="flex gap-4">
                      <div className="min-w-10">
                        <BulletChecked />
                      </div>

                      <Heading
                        level={3}
                        className="text-md uppercase font-bold -mt-0.5"
                      >
                        Summer Solstice,{' '}
                        <span className="font-normal">2025</span>,{' '}
                        <span className="text-accent">12.5%</span>
                      </Heading>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-12 sm:mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="font-bold sm:font-extrabold normal-case text-center mt-12 max-w-[620px] mb-10 text-lg  sm:text-xl"
              >
                <p className="text-accent text-2xl sm:text-5xl">
                  Making the Airdrop accessible 
                </p>
                for Web3 Newbies:
              </Heading>
              <div className="max-w-[550px] text-sm flex flex-col gap-4 mb-20">
                <p>
                  Follow this{' '}
                  <Link
                    className="text-accent"
                    href="https://drive.google.com/file/d/1LMl8pvDqpxFFz6RtvVgyMBlTO_zWWOFZ/view"
                  >
                    step-by-step guide
                  </Link>
                  , or hop into our{' '}
                  <Link
                    className="text-accent"
                    href="https://t.me/+bW0K8E7ZGVE4ZjBh"
                  >
                    Web3 support group
                  </Link>{' '}
                  to set up a Web3 wallet and connect to the TDF platform.
                </p>
                <p>
                  Thank you for being with us on this journey towards
                  regeneration!
                </p>
                <p>Sending love and baaahhhs from Alentejo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

AirdropPage.getInitialProps = async (context: NextPageContext) => {
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

export default AirdropPage;
