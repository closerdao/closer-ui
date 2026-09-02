import type { NextApiRequest, NextApiResponse } from 'next';

import {
  GeocodeResult,
  searchNominatimPlaces,
} from '../../../utils/geocode.helpers';

type SuccessBody = { results: GeocodeResult[] };
type ErrorBody = { error: string };

const CACHE_TTL_MS = 10 * 60 * 1000;
const MIN_INTERVAL_MS = 1100;
const MAX_CACHE_ENTRIES = 200;

const cache = new Map<string, { expires: number; results: GeocodeResult[] }>();
let nextAllowedAt = 0;
let queue: Promise<void> = Promise.resolve();

const getCached = (key: string): GeocodeResult[] | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expires <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.results;
};

const setCached = (key: string, results: GeocodeResult[]) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, results });
};

const enqueueNominatim = async <T>(task: () => Promise<T>): Promise<T> => {
  let release: () => void = () => undefined;
  const previous = queue;
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  const wait = Math.max(0, nextAllowedAt - Date.now());
  if (wait) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  nextAllowedAt = Date.now() + MIN_INTERVAL_MS;
  try {
    return await task();
  } finally {
    release();
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    return res.status(200).json({ results: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) {
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results: cached });
  }

  try {
    const results = await enqueueNominatim(() => {
      const cachedAfterWait = getCached(cacheKey);
      if (cachedAfterWait) return Promise.resolve(cachedAfterWait);
      return searchNominatimPlaces(q);
    });
    setCached(cacheKey, results);
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Place search failed';
    return res.status(502).json({ error: message });
  }
}
