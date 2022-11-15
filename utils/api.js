import axios from 'axios';

import config from '../config';

export const formatSearch = (where) =>
  encodeURIComponent(JSON.stringify(where));
export const cdn = config.CDN_URL;

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'X-Platform': config.PLATFORM,
  },
});

if (config.LOG_REQUESTS) {
  api.interceptors.request.use((req) => {
    console.log(req.method, req.url, req.params);
    return req;
  });
}

export default api;
