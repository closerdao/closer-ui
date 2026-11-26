import type { InternalAxiosRequestConfig } from 'axios';

import api from '../api';
import { countSales, sumSales } from '../sales';

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: () => false,
}));

const tokensPaid = {
  $and: [{ product_type: { $in: ['token', 'tokens'] } }, { status: 'paid' }],
};

// The request interceptor in utils/api.js turns an object `where` into JSON, so legacy filters on it.
it('sends the count and sum where as JSON on the wire', async () => {
  const sent: InternalAxiosRequestConfig[] = [];
  api.defaults.adapter = async (config) => {
    sent.push(config);
    return {
      data: { results: 1 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };

  await countSales(tokensPaid);
  await sumSales('total_price', tokensPaid);

  const urls = sent
    .map((config) => new URL(api.getUri(config)))
    .filter((url) => /\/(count|sum)\/sale/.test(url.pathname));
  expect(
    urls.map((url) => [url.pathname, url.searchParams.get('where')]),
  ).toEqual([
    ['/count/sale', JSON.stringify(tokensPaid)],
    ['/sum/sale/total_price', JSON.stringify(tokensPaid)],
  ]);
});
