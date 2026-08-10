import type { GetServerSideProps } from 'next';

import { salesHubTabPath, SALES_HUB_DEFAULT_TAB } from '../../../utils/salesHub';

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: salesHubTabPath(SALES_HUB_DEFAULT_TAB),
    permanent: false,
  },
});

const SalesDashboardIndexRedirect = () => null;

export default SalesDashboardIndexRedirect;
