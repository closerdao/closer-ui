import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

export type Country = {
  code: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type UrlPreview = {
  title?: string;
  description?: string;
  image?: string;
  url: string;
};

// Legacy `GET /meta/countries`.
export const fetchCountries = async (): Promise<Country[]> => {
  if (!isTrpcEnabled()) {
    const res = await api.get('/meta/countries');
    return res.data.results;
  }
  return trpc.meta.countries.query().catch(throwApiError);
};

// Legacy `GET /url-lookup/:url`: the page's title, description and image.
export const fetchUrlPreview = async (url: string): Promise<UrlPreview> => {
  if (!isTrpcEnabled()) {
    const res = await api.get(`/url-lookup/${encodeURIComponent(url)}`);
    return res.data.results;
  }
  return trpc.meta.urlPreview.query({ url }).catch(throwApiError);
};
