import { useState } from 'react';

import Layout from '../../components/Layout';

import { __ } from '../../utils/helpers';

const CEUR_PER_TDF = 230.23;

const TokenSalePage = () => {
  const [weeksNumber, setWeeksNumber] = useState(4);
  const [selectedRoom, selectRoom] = useState('Private room');
  const [tokenToBuy, setTokenToBuy] = useState(0);
  const [tokenToSpend, setTokenToSpend] = useState(tokenToBuy * CEUR_PER_TDF);

  const handleTDFChange = (event) => {
    const value = event.target.value;
    setTokenToBuy(value);
    setTokenToSpend(value * CEUR_PER_TDF);
  };

  const handleCEURChange = (event) => {
    const value = event.target.value;
    setTokenToSpend(value);
    setTokenToBuy(value / CEUR_PER_TDF);
  };

  return (
    <Layout>
      <div className="flex flex-col w-full px-20 mt-20">
        <div className="flex mb-4 gap-8">
          <div className="basis-1/2">
            <h1 className="text-8xl uppercase font-black">
              {__('token_sale_page_title')}
            </h1>
            <p className="mt-10 text-2xl leading-8 font-bold max-w-sm">
              {__('token_sale_page_description')}
            </p>
          </div>
          <div className="basis-1/2 w-[410px] h-[410px] bg-[url('/images/token_hero_placeholder.jpg')] bg-cover bg-center"></div>
        </div>
        <p className="flex self-center mt-28 items-center">
          <span>I want to stay</span>
          <input
            type="number"
            value={weeksNumber}
            onChange={(e) => setWeeksNumber(e.target.value)}
            min={1}
            max={52}
            step={1}
            className="inline !w-fit !p-0 m-0 mx-2"
          />
          <span>weeks per year in a</span>
          <select
            value={selectedRoom}
            onChange={(e) => selectRoom(e.target.value)}
            className="mx-2 p-0 pl-2 pr-7"
          >
            <option>Private room</option>
            <option>Shared room</option>
          </select>
          <span>I should buy</span>
        </p>
        <div className="flex flex-col w-96 self-center mt-24">
          <div className="relative">
            <input
              value={tokenToBuy}
              onChange={handleTDFChange}
              className="h-16 text-right rounded-full px-4"
            />
            <p className="absolute top-2 left-2 bg-gray-100 py-3 px-6 rounded-full">
              $TDF
            </p>
          </div>
          <p className="text-stone-500 text-xs w-full text-center p-1">
            1 $TDF = 230.23 CEUR
          </p>
          <div className="relative">
            <input
              value={tokenToSpend}
              onChange={handleCEURChange}
              className="h-16 text-right rounded-full px-4"
            />
            <p className="absolute top-2 left-2 bg-gray-100 py-3 px-6 rounded-full">
              CEUR
            </p>
          </div>
          <button className="btn uppercase mt-6">Buy now</button>
        </div>
      </div>
    </Layout>
  );
};

export default TokenSalePage;
