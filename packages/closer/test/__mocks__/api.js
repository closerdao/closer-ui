const formatSearch = (where) =>
  typeof where !== 'undefined' ? encodeURIComponent(JSON.stringify(where)) : '';

const cdn = process.env.NEXT_PUBLIC_CDN_URL || '';

const api = {
  get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  defaults: { headers: {} },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

module.exports = api;
module.exports.formatSearch = formatSearch;
module.exports.cdn = cdn;
