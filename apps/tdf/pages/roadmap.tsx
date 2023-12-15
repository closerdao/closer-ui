import Head from 'next/head';

import React from 'react';

import { Heading, Button } from 'closer';

const RoadmapPage = () => (
  <>
    <Head>
      <title>
        Traditional Dream Factory | Regenerative coliving space in Alentejo,
        Portugal
      </title>
    </Head>
    <main className="mx-auto max-w-3xl">
      <section className="flex flex-wrap justify-center">
        <div>
          <Heading
            className="text-4xl mb-6 max-w-3xl text-center mt-8  uppercase sm:text-5xl bg-[url(/images/landing/spade.png)] bg-no-repeat pt-[170px] bg-top"
            level={2}
          >
            The journey of our regenerative village
          </Heading>
        </div>
      </section>
      <section className="flex items-center flex-col py-24">
        <div className="w-full sm:w-[80%] flex items-center flex-col">
          <div className="max-w-[800px]">
            <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
              <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2021</span>
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <p className="uppercase font-bold">Keys to the farm & basic infrastructure</p>
                <ul className=" my-4 list-none">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Operational event venue (up to 100 guests)
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    10 glamping accommodations
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    2000 trees reforestation
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    7kw solar energy system
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Workshop
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Industrial kitchen
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
              <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2022</span>
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <p className="uppercase font-bold">Operational CO-LIVING</p>
                <ul className=" my-4 list-none">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    1000 trees food forest
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Sauna
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Co-working
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    DAO prototype
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Architectural plans
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
              <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2023</span>
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <p className="uppercase font-bold">Platform & token launch, plans approved.</p>
                <ul className=" my-4 list-none">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Starlink
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    14 glamping accommodations, 8 volunteer beds
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Market garden
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Grey water treatment (helophyte filter)
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Booking platform & token
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Engineering plans
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Biochar production
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt"></div>
              <div className="w-7 h-7 bg-accent-alt-light border-4 border-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2024</span>
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <Heading level={4} className="uppercase text-accent">
                  FUNDRAISING
                </Heading>
                <p className="uppercase font-bold mt-6">We are here</p>
                {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE && (
                  <Button
                    onClick={() => router.push('/token')}
                    className="my-6"
                    size="small"
                  >
                    Invest
                  </Button>
                )}
                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Co-living building renovation, with first 6 suites
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Natural pool
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Acquire 25ha of land
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Build 2 lakes
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Start a tiny-house development
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Pay off loan & transfer property into the company
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt"></div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading
                level={4}
                className="font-normal uppercase text-accent"
              >
                2025
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Makerspace
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Restaurant
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Mushroom farm
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    10 000 fruit tree orchard
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Rewilding zone
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Biomorphic coworking garden
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    4 studios
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Family house
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Tropical greenhouse
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_270px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent"></div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                TDF: GO LIVE EVENT 🎉🎉🎉
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <ul className="mt-6">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    TDF V1 IS READY!
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    $TDF UNSTAKED
                  </li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-[37px_270px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt"></div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading
                level={4}
                className="font-normal uppercase text-accent"
              >
                2026
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-12">
                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Co-housing expansion plans
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  </>
);

export default RoadmapPage;
