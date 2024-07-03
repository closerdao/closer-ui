import router from 'next/router';

import { useTranslations } from 'next-intl';

import { Button, Heading } from '../ui';

interface Props {
  id?: string;
}

const Ama = ({ id }: Props) => {
  const t = useTranslations();
  return (
    <section id={id} className="flex items-center flex-col py-24 ">
      <div className="max-w-6xl ">
        <div className="text-center mb-8">
          <Heading level={2} className="mb-4 text-5xl font-bold">
            {t('token_sale_ama_heading')}
          </Heading>
          <div className="w-full flex justify-center">
            <Heading level={3} className="mb-4 text-lg font-bold max-w-[600px]">
              {t('token_sale_ama_subheading')}
            </Heading>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            className="text-[16px]"
            onClick={() => {
              router.push('https://calendly.com/samueldelesque');
            }}
          >
            {t('token_sale_public_sale_button_book_a_call')}
          </Button>
        </div>
        {/* <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[19%]">
            <Heading level={3} className="text-center">
              {t('token_sale_public_sale_sam')}
              <span className="block text-sm font-normal capitalize">
                {t('token_sale_ama_sheep009')}
              </span>
            </Heading>
            <Image
              src={'/images/token-sale/sam.jpg'}
              alt="Sam"
              width={100}
              height={100}
            />

            <div className="text-sm text-center w-full flex-wrap flex justify-center gap-2">
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_partnerships')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_public_sale_vision')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_land')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_oasa')}
              </div>
            </div>
            <Button
              className="text-[16px]"
              onClick={() => {
                router.push('https://calendly.com/samueldelesque');
              }}
            >
              {t('token_sale_public_sale_button_book_a_call')}
            </Button>
          </Card>
          <Card className="mb-8 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[19%]">
            <Heading level={3} className="text-center">
              {t('token_sale_ama_ani')}
              <span className="block text-sm font-normal capitalize">
                {t('token_sale_ama_sheep011')}
              </span>
            </Heading>
            <Image
              src={'/images/token-sale/ani.jpg'}
              alt="Ani"
              width={100}
              height={100}
            />

            <div className="text-sm text-center w-full flex-wrap flex justify-center gap-2">
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_operations')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_public_sale_vision')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_partnerships')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_legal')}
              </div>
            </div>
            <Button
              className="text-[16px]"
              onClick={() => {
                router.push('https://lu.ma/1and9jrs');
              }}
            >
              {t('token_sale_public_sale_button_book_a_call')}
            </Button>
          </Card>
          <Card className="mb-8 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[19%]">
            <Heading level={3} className="text-center">
              {t('token_sale_public_sale_bea')}
              <span className="block text-sm font-normal capitalize">
                {t('token_sale_ama_sheep014')}
              </span>
            </Heading>
            <Image
              src={'/images/token-sale/bea.jpg'}
              alt="Bea"
              width={100}
              height={100}
            />

            <div className="text-sm text-center w-full flex-wrap flex justify-center gap-2">
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_operations')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_public_sale_vision')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_partnerships')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_legal')}
              </div>
            </div>
            <Button
              className="text-[16px]"
              onClick={() => {
                router.push('https://lu.ma/vnts9n0v');
              }}
            >
              {t('token_sale_public_sale_button_book_a_call')}
            </Button>
          </Card>
          <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[19%]">
            <Heading level={3} className="text-center">
              {t('token_sale_ama_charlie')}
              <span className="block text-sm font-normal capitalize">
                {t('token_sale_ama_sheep001')}
              </span>
            </Heading>
            <Image
              src={'/images/token-sale/charlie.jpg'}
              alt="Cahrlie"
              width={100}
              height={100}
            />

            <div className="text-sm text-center w-full flex-wrap flex justify-center gap-2">
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_risk')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_governance')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_tokenomics')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_land_trusts')}
              </div>
            </div>
            <Button
              className="text-[16px]"
              onClick={() => {
                router.push('https://lu.ma/oz471p2e');
              }}
            >
              {t('token_sale_public_sale_button_book_a_call')}
            </Button>
          </Card>
          <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[19%]">
            <Heading level={3} className="text-center">
              {t('token_sale_public_sale_juliana')}
              <span className="block text-sm font-normal capitalize">
                {t('token_sale_ama_sheep006')}
              </span>
            </Heading>
            <Image
              src={'/images/token-sale/juliana.jpg'}
              alt="Juliana"
              width={100}
              height={100}
            />

            <div className="text-sm text-center w-full flex-wrap flex justify-center gap-2">
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_stays')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_space_operations')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_volunteer')}
              </div>
              <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                {t('token_sale_tag_events')}
              </div>
            </div>
            <Button
              className="text-[16px]"
              onClick={() => {
                router.push('https://calendly.com/cosmicweave/ama_space_mgm');
              }}
            >
              {t('token_sale_public_sale_button_book_a_call')}
            </Button>
          </Card>
        </div> */}
      </div>
    </section>
  );
};

export default Ama;
