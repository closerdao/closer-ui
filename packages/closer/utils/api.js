import axios from 'axios';

export const formatSearch = (where) =>
  encodeURIComponent(JSON.stringify(where));
export const cdn = process.env.NEXT_PUBLIC_CDN_URL;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

if (process.env.NEXT_PUBLIC_LOG_REQUESTS === 'true') {
  api.interceptors.request.use((req) => {
    console.log(req.method, req.url, req.params);
    return req;
  });
}

export default api;
