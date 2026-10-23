import Head from 'next/head';

import { NextPageContext } from 'next';

import GovernanceWeight from '../../components/Dashboard/GovernanceWeight';
import { parseMessageFromError } from '../../utils/common';

const GovernanceWeightPage = () => {
  return (
    <>
      <Head>
        <title>TDF Governance Weight</title>
        <meta
          name="description"
          content="Who holds TDF governance weight today, where it comes from, and how it compares to what the whitepaper describes — read live from Celo mainnet."
        />
      </Head>
      <GovernanceWeight />
    </>
  );
};

GovernanceWeightPage.getInitialProps = async (context: NextPageContext) => {
  try {
    return {};
  } catch (error) {
    return {
      error: parseMessageFromError(error),
    };
  }
};

export default GovernanceWeightPage;
