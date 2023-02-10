import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';

const WhiteListed = () => {
  const { user } = useAuth();
  const referralLink = `https://traditionaldreamfactory.com/token-sale/invite/${user?._id}`;
  return (
    <>
      <h2 className="text-4xl leading-snug mt-20">
        {__('token_sale_referral_code_title')}
      </h2>
      <div className="flex gap-4 mt-8">
        <button className="bg-primary text-white uppercase font-bold text-4xl py-3 px-12 rounded-full whitespace-nowrap">
          {__('buttons_copy_code')}
        </button>
        <div className="bg-primary-light text-primary upercase text-2xl py-3 px-10 whitespace-nowrap rounded-full">
          {referralLink}
        </div>
      </div>
      <div className="mt-24 flex flex-col gap-8">
        <p>{__('token_sale_invite_page_process_description')}</p>
        <p>{__('token_sale_invite_page_process_price')}</p>
      </div>
    </>
  );
};

export default WhiteListed;
