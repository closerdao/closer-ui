import type { GetServerSideProps } from 'next';

import {
  SALES_HUB_DEFAULT_TAB,
  salesHubTabPath,
} from '../../../utils/salesHub';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: salesHubTabPath(SALES_HUB_DEFAULT_TAB),
    permanent: false,
  },
});

const SalesDashboardIndexRedirect = () => null;

export default SalesDashboardIndexRedirect;
