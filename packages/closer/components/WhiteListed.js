import { useRouter } from 'next/router';

import PropTypes from 'prop-types';

import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';
import Heading from './ui/Heading';

const WhiteListed = ({ referredUsers }) => {
  const { user } = useAuth();
  const router = useRouter();
  const referralLink = `${window.location.host}${router.pathname}/${user?._id}`;

  const copyCode = async () => {
    if (user?._id) {
      await navigator.clipboard.writeText(referralLink);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Heading level={2} className="text-4xl leading-snug mt-4 md:mt-20">
        {__('token_sale_referral_code_title')}
      </Heading>
      <div className="flex flex-col-reverse md:flex-row gap-4 mt-2 md:mt-8">
        <button
          onClick={copyCode}
          className="bg-accent text-white uppercase font-bold w-full md:w-fit text-2xl md:text-4xl py-3 px-12 rounded-full whitespace-nowrap"
        >
          {__('token_sale_invite_buttons_copy_code')}
        </button>
        <div className="bg-accent-light text-accent upercase text-base md:text-2xl py-3 px-4 md:px-10 md:whitespace-nowrap rounded-full">
          {referralLink}
        </div>
      </div>
      <div className="mt-8 md:mt-24 flex flex-col gap-8">
        <p>{__('token_sale_invite_page_process_description')}</p>
        <p>{__('token_sale_invite_page_process_price')}</p>
      </div>
      <div className="my-7 flex flex-wrap gap-10">
        {referredUsers?.map((user) => (
          <div
            className="flex flex-col gap-5 justify-center items-center"
            key={user._id}
          >
            <div className="bg-accent-light w-20 h-20 rounded-full relative">
              <div className="w-12 h-12 bg-accent absolute rounded-full left-4 top-4" />
            </div>
            <p className="font-medium text-2xl uppercase">
              {user.screenname.slice(0, 3)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

WhiteListed.propTypes = {
  referredUsers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      screenname: PropTypes.string,
    }),
  ),
};

export default WhiteListed;
