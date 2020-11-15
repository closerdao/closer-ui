import axios from 'axios';

const host = (
  typeof window !== 'undefined' && window.location.host === 'localhost:12222' ||
  process && process.env.ENV === 'local'
) ?
  'http://localhost:9225':
  'https://api.oasa.co'
;

export const formatSearch = where => encodeURIComponent(JSON.stringify(where));

export default axios.create({
  baseURL: host
});
