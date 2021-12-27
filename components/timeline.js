import React, { useState } from 'react'

const Timeline = () => {
  return (
    <section>
      <div className="relative wrap overflow-hidden h-full">
        <h2 className="text-center mb-6 font-bold text-2xl">Milestones</h2>
        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="lg:w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">Winter '20</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🏭 Purchased Factory</li>
              <li>📝 Hired <a href="https://cruatelier.pt/" target="_blank">CRU architects</a> and drafted plans</li>
              <li>🏕️ Acquired 10 glamping tents</li>
              <li>🖊️ Drafted and signed a lease on the 5ha of land next to the factory, with an option to buy 25ha.</li>
              <li>📜 Created <a href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/mobilebasic" target="_blank">Pink Paper</a>, cost estimate & tokenization model</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">Spring '21</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🏭 Connected electricity, city water, solar power, cleaned up house & warehouses, setup the glamping tents</li>
              <li>🍳 Temporary industrial kitchen setup</li>
              <li>🖥️ Setup a coworking space, built furniture</li>
              <li>💦 Initial irrigation of gardens</li>
              <li>🗺️ Topography of land</li>
              <li>🌳 Planted 30+ trees & a first productive garden, removed fences, created compost</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">Summer '21</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>⚡ Built basic infrastructure to host 100+ people: compost toilets, showers, bar, parking spaces</li>
              <li>🍻 Built bar and ran electricity lines throughout lands</li>
              <li>🖊️ Incorporated "Enseada Sonhadora S.A."</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">Fall '21</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🌳 Covered deforested hill with nitrogen fixing crops & planted 1500 trees</li>
              <li>🔥 Built sauna </li>
              <li>🏠 Insulated the house</li>
              <li>🥳 Hosted first big events: <a href="https://re-build.co" target="_blank">re:build</a> & <a href="https://primalgathering.co/" target="_blank">Primal gatherings</a></li>
              <li>🌱 Setup a tree nursery from seeds collected in the area</li>
              <li>📝 Architectural plans in final phase</li>
              <li>🖊️ Legal structure & DAO model updated</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-green-400 text-lg p-1">Winter '21</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>💤 TDF closed for the winter</li>
              <li>🏠️ Engineering review & prepare 2022 construction roadmap</li>
              <li>🖥️ Develop an MVP of <a href="https://closer.earth" target="_blank">Closer</a> platform <i>(we are building an operating system for land stewardship cmmunities!)</i></li>
              <li>🖊️ Preparation of DAO launch</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">Spring '22</h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🌳 Add additional biodiversity & cover crops to forest</li>
              <li>🖥️ Launch Closer MVP with ability to handle bookings, events & tasks</li>
              <li>🏠️ Complete renovation of house & start insulation of coliving building</li>
              <li>💰 Raise capital for the first phases of construction</li>
              <li>🗳️ Start onboarding community onto DAO governance systems</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">Summer '22 <span className="text-xs">(expected)</span></h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🏠️ Construction of first 6 suites</li>
              <li>💦 Setup gray & black water systems</li>
              <li>⚡ Electrical & plumbing infrastructure</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:flex lg:justify-between flex-row-reverse items-center left-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">Fall '22 <span className="text-xs">(expected)</span></h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <ol className="text-md">
              <li>🌳 Plant food forest in collaboration with <a href="http://www.growback.net/" target="_blank">Marc Leiber</a></li>
              <li>🏠️ Build out 8 additional suites, renovate cafe, event space & coworking</li>
            </ol>
          </div>
        </div>

        <div className="mb-4 lg:mb-8 lg:flex lg:justify-between items-center right-timeline">
          <div className="w-12"></div>
          <div className="flex items-center mb-2 lg:mb-0">
            <h3 className="mx-auto font-semibold border-b-4 border-blue-400 text-lg p-1">Summer '23 <span className="text-xs">(expected)</span></h3>
          </div>
          <div className="lg:bg-gray-100 lg:rounded-lg lg:shadow-xl lg:w-5/12 py-2 lg:px-2">
            <h2 className="text-lg font-bold mb-2 text-center">Go Live!</h2>
            <ol className="text-md">
              <li>🖊️ Execute purchase option on reminder 25Ha of land</li>
              <li>💰 Tokens become liquid and can be resold</li>
              <li>🏠️ Members can check in using their tokens directly</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Timeline
