import { NextPageContext } from 'next';

import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';

export type DonateSharedPageProps = {
  generalConfig: GeneralConfig | null;
};

export async function getDonateInitialProps(
  context: NextPageContext,
): Promise<DonateSharedPageProps & { error?: string }> {
  try {
    const generalRes = await api.get('/config/general').catch(() => null);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      };
  }
}
