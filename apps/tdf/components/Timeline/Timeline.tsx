import { FC } from 'react';

import { PINK_PAPER_URL } from '@/constants';

export const Timeline: FC = () => {
  return (
    <section>
      <div className="relative wrap overflow-hidden h-full">
        <h2 className="text-center mb-6 font-bold text-2xl" id="milestones">
          Milestones
        </h2>
        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="lg:w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Winter &apos;20
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🏭 Purchased Factory</li>
              <li>
                📝 Hired{' '}
                <a
                  href="https://cruatelier.pt/"
                  target="_blank"
                  rel="noreferrer"
                >
                  CRU architects
                </a>{' '}
                and drafted plans
              </li>
              <li>🏕️ Acquired 10 glamping tents</li>
              <li>
                🖊️ Drafted and signed a lease on the 5ha of land next to the
                factory, with an option to buy 25ha.
              </li>
              <li>
                📜 Created{' '}
                <a href={PINK_PAPER_URL} target="_blank" rel="noreferrer">
                  Pink Paper
                </a>
                , cost estimate & tokenization model
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Spring &apos;21
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                🏭 Connected electricity, city water, solar power, cleaned up
                house & warehouses, setup the glamping tents
              </li>
              <li>🍳 Temporary industrial kitchen setup</li>
              <li>🖥️ Setup a coworking space, built furniture</li>
              <li>💦 Initial irrigation of gardens</li>
              <li>🗺️ Topography of land</li>
              <li>
                🌳 Planted 30+ trees & a first productive garden, removed
                fences, created compost
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Summer &apos;21
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                ⚡ Built basic infrastructure to host 100+ people: compost
                toilets, showers, bar, parking spaces
              </li>
              <li>🍻 Built bar and ran electricity lines throughout lands</li>
              <li>🖊️ Incorporated &ldquo;Enseada Sonhadora S.A.&rdquo;</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Fall &apos;21
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                🌳 Covered deforested hill with nitrogen fixing crops & planted
                1500 trees
              </li>
              <li>🔥 Built sauna </li>
              <li>🏠 Insulated the house</li>
              <li>
                🥳 Hosted first big events:{' '}
                <a href="https://re-build.co" target="_blank" rel="noreferrer">
                  re:build
                </a>{' '}
                &{' '}
                <a
                  href="https://primalgathering.co/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Primal gatherings
                </a>
              </li>
              <li>🌱 Setup a tree nursery from seeds collected in the area</li>
              <li>📝 Architectural plans in final phase</li>
              <li>🖊️ Legal structure & DAO model updated</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Winter &apos;21
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>💤 TDF closed for the winter</li>
              <li>
                🏠️ Engineering review & prepare 2022 construction roadmap
              </li>
              <li>
                🖥️ Develop an MVP of{' '}
                <a href="https://closer.earth" target="_blank" rel="noreferrer">
                  Closer
                </a>{' '}
                platform{' '}
                <i>
                  (we are building an operating system for land stewardship
                  cmmunities!)
                </i>
              </li>
              <li>🖊️ Preparation of DAO launch</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Spring &apos;22
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                🌳 Planted an additional ~200 trees and started our food forest
              </li>
              <li>
                🖥️ Launched Closer MVP with ability to handle bookings & events
              </li>
              <li>🏠️ Completed insulation of house</li>
              <li>💰 Raised seed capital from members</li>
              <li>
                ⚡ Hosted{' '}
                <a
                  href="https://refispring.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  ReFi Spring Portugal
                </a>
                ,{' '}
                <a
                  href="https://magika.fm/heartmagika/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Heart: Magika
                </a>{' '}
                and other events
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">
              Summer &apos;22
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                🏠️ Got our architectural plans approved by the municipality,
                and working on engineering plans
              </li>
              <li>🏠️ Built a tree house & other land facilities</li>
              <li>💦 Setup our grey water systems & started our biopool</li>
              <li>
                ⚡ Hosted the Abela Art Faire and had our first artists
                residents creating art on the lands
              </li>
              <li>
                🖥️ Deployed our smart contracts to testnet, allowing for
                bookings on chain & giving utility to our future $TDF token.
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">
              Fall &apos;22 <span className="text-xs">(expected)</span>
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>
                🌳 Plant food forest in collaboration with{' '}
                <a
                  href="http://www.growback.net/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Marc Leiber
                </a>{' '}
                and others
              </li>
              <li>
                💰 Expecting to launch our token sale once the Swiss authorities
                approve our utility token
              </li>
              <li>📝 Completing engineering plans to submit to municipality</li>
              <li>🏠️ Preparing for construction of the first 6 suites</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">
              Summer &apos;23 - Summer &apos;24{' '}
              <span className="text-xs">(expected)</span>
            </h3>
          </div>
          <div className="lg:bg-pink-200 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <h2 className="text-lg font-bold mb-2 text-center">Go Live!</h2>
            <ol className="text-md">
              <li>🖊️ Execute purchase option on reminder 25Ha of land</li>
              <li>💰 Tokens become liquid and can be resold</li>
              <li>🏠️ Construction is completed</li>
              <li>🏠️ Members can check in using their tokens directly</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
