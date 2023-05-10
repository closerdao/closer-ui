import Head from 'next/head';
import Image from 'next/image';

import { Button, Card, Heading } from '../../../components/ui';

import { useConfig } from 'closer';
import { __ } from 'closer/utils/helpers';
// import TokenBuyWidget from '../../../components/TokenBuyWidget';
import router from 'next/router';

const PublicTokenSalePage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        {/* <TokenBuyWidget weeks={3} selectedAccomodation="Glamping"/> */}
        <section className="mb-10">
          <div className='rounded-lg h-[500px] md:h-[700px] flex items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.png")]'>
            <h1 className="px-4 mb-8 mt-[170px] md:mt-[280px] max-w-[600px] text-center font-extrabold text-3xl md:text-6xl uppercase">
              {__('token_sale_public_sale_announcement')}
            </h1>

            <h2 className="px-4 mb-8 text-center leading-5 max-w-[460px] font-bold uppercase text-md">
              {__('token_sale_public_sale_subheading')}
            </h2>
            <Button className="!w-60 font-bold mb-3 md:mb-8 relative">
              <Image
                className="absolute left-[200px] w-14 h-18"
                src="/images/token-sale/arrow.png"
                alt="arrow"
                width={85}
                height={99}
              />
              {__('token_sale_public_sale_buy_token')}
            </Button>
            <h3 className="font-bold text-2xl">
              N {__('token_sale_public_sale_tokens_left')}
            </h3>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] ">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_key_info')}
              </h2>
              <div>{__('token_sale_public_sale_key_info_subhead')}</div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-6">
              <Card className="mb-8 px-6 py-8 text-center flex flex-col gap-8 md:w-1/3">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_white_paper')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_white_paper')}</p>
                <Button className="text-[17px]" onClick={() => {
                  router.push('/')
                }}>
                  {__('token_sale_public_sale_button_read')}
                </Button>
              </Card>
              <Card className="mb-8 px-6 py-8 text-center flex flex-col gap-8 md:w-1/3">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_investor_doc')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_investor_doc')}</p>
                <Button className="text-[17px]">
                  {__('token_sale_public_sale_button_read')}
                </Button>
              </Card>
              <Card className="mb-8 px-6 py-8 text-center flex flex-col gap-8  md:w-1/3">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_chat_to_us')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_chat_to_us')}</p>
                <Button className="text-[17px]">
                  {__('token_sale_public_sale_button_book')}
                </Button>
              </Card>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_utility')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_utility')}</div>
            </div>
            <div className="flex flex-col w-full md:w-[460px]">
              <Heading level={3} className="mb-6">
                {__('token_sale_public_sale_heading_accommodation_cost')}
              </Heading>
              <Card className="mb-8 px-6 py-8 text-left flex flex-col gap-1 text-md">
                <div className="text-right text-sm">
                  {__('token_sale_public_sale_price_per_night')}
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/van.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_van_parking')}
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}0.5
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/camping.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_outdoor_camping')}
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}0.5
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/camping.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_glamping')}
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}1
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className="pt-1">
                    {__('token_sale_public_sale_shared_suite')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className="text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}1
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_private_suite')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}2
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_studio')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}3
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {__('token_sale_public_sale_house')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')}5
                  </p>
                </div>
              </Card>
              <div className="text-xs text-center">
                {__('token_sale_public_sale_prices_disclaimer')}
              </div>
              <div className="text-sm mt-20 mb-6 text-center">
                {__('token_sale_public_sale_utility_info_1')}
              </div>
              <div className="text-sm mb-6 text-accent text-center">
                {__('token_sale_public_sale_utility_info_2')}
              </div>
              <div className="text-sm mb-6 text-center">
                {__('token_sale_public_sale_utility_info_3')}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_why_now')}
              </h2>
            </div>
            <div className="flex flex-col w-full md:w-[460px]">
              <div>
                <ul className="flex flex-col gap-3 mb-10">
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_1')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_2')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_3')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_4')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_5')}
                  </li>
                </ul>
                <div>
                  <p className="text-xs mb-4">
                    {__('token_sale_public_sale_example')}
                  </p>
                  <p className="text-xs">
                    {__('token_sale_public_sale_example_text')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_tokenomics')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_tokenomics')}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <Card className="mb-0">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_base_price')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics1.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="!mb-0">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_target_supply')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics2.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_sale_price')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics3.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_liquidity')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics4.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_future_scenarios')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics5.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_distribution')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics6.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_roadmap')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_roadmap')}</div>
            </div>
            <div className='max-w-[600px]'>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'>{__('token_sale_public_sale_roadmap_subheading_1')}</div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_1')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className='h-40'></div>
              </div>
              
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'>{__('token_sale_public_sale_roadmap_subheading_2')}</div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_2')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className='pb-20'>
                  <ul className='list-disc pl-5 my-4'>
                    <li>{__('token_sale_public_sale_roadmap_2_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_6')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_7')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_8')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_9')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'></div>
                <div className="w-7 h-7 bg-accent-light border-4 border-accent rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_3')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className='pb-20'>
                  <Button type="secondary" className='my-6'> {__('token_sale_public_sale_roadmap_3_cta_button')}</Button>
                </div>
              </div>
             
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'>{__('token_sale_public_sale_roadmap_subheading_4')}</div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_4')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className='pb-20'>
                  <ul className='list-disc pl-5 my-4'>
                    <li>{__('token_sale_public_sale_roadmap_4_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_6')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'>{__('token_sale_public_sale_roadmap_subheading_5')}</div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_5')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className='pb-20'>
                  <ul className='list-disc pl-5 my-4'>
                    <li>{__('token_sale_public_sale_roadmap_5_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_6')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_7')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className='text-accent'>{__('token_sale_public_sale_roadmap_subheading_6')}</div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className=''>{__('token_sale_public_sale_roadmap_heading_6')}</Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className='pb-20'>
                  <ul className='list-disc pl-5 my-4'>
                    <li>{__('token_sale_public_sale_roadmap_6_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_5')}</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicTokenSalePage;
