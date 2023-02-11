import Layout from '../../../components/Layout';
import TokenSaleHeader from '../../../components/TokenSaleHeader';
import WhiteListConditions from '../../../components/WhiteListConditions';
import WhiteListed from '../../../components/WhiteListed';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

dayjs.extend(customParseFormat);

const InvitedByPage = ({ referredByUser }) => {
  const { user } = useAuth();
  const { isWhiteListed } = user || {};

  const saleDate = dayjs(config.TOKEN_SALE_DATE, 'DD/MM/YYYY');

  return (
    <Layout>
      <div className="w-full px-20 mt-20">
        <div className="flex mb-4">
          <TokenSaleHeader
            hasCountDown={config.IS_COUNTDOWN_ON}
            saleDate={saleDate}
            title={
              isWhiteListed
                ? __(
                    'token_sale_invite_page_whitelisted_title',
                    user?.screenname,
                  )
                : __('token_sale_invite_page_title')
            }
          />
        </div>
        <div className="flex flex-col gap-4">
          {isWhiteListed ? (
            <WhiteListed />
          ) : (
            <WhiteListConditions referredByUser={referredByUser} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = async ({ query }) => {
  try {
    const res = await api.get(`/user/${query.referralId}`);
    console.log(res.data.results);
    return {
      props: {
        referredByUser: res.data.results,
      },
    };
  } catch (err) {
    console.log(
      'Error',
      err.response.status,
      err.response.status === '404',
      err.response.status === 404,
    );
    if (err.response.status === 404) {
      console.log('return redirect to /token-sale/invite');
      return {
        // redirect to /token-sale/invite
        redirect: {
          destination: '/token-sale/invite',
          permanent: false,
        },
      };
    }
    return {
      notFound: true,
    };
  }
};

export default InvitedByPage;
