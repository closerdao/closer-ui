import { api } from 'closer';

const platformUrl =
  process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://earthbound.eco';

const normalizeBaseUrl = (url) => url.replace(/\/$/, '');

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toUrl = (path) => {
  const baseUrl = normalizeBaseUrl(platformUrl);
  if (!baseUrl) return '';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const fetchResults = async (path) => {
  try {
    const response = await api.get(path);
    return Array.isArray(response?.data?.results) ? response.data.results : [];
  } catch {
    return [];
  }
};

function generateSiteMap({ articles, events, pages, volunteerOpportunities }) {
  const urls = [
    toUrl('/'),
    toUrl('/blog'),
    toUrl('/events'),
    toUrl('/login'),
    toUrl('/signup'),
    toUrl('/stay'),
    toUrl('/subscriptions'),
    toUrl('/volunteer'),
    ...articles.map(({ slug }) => toUrl(`/blog/${slug}`)),
    ...events.map(({ slug }) => toUrl(`/events/${slug}`)),
    ...volunteerOpportunities.map(({ slug }) => toUrl(`/volunteer/${slug}`)),
    ...pages.map(({ slug }) => toUrl(slug)),
  ].filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`,
  )
  .join('\n')}
</urlset>`;
}

function SiteMap() {}

export async function getServerSideProps({ res }) {
  const [articles, events, pages, volunteerOpportunities] = await Promise.all([
    fetchResults('/article?limit=500'),
    fetchResults('/event?limit=500'),
    fetchResults('/page?limit=500'),
    fetchResults('/volunteer?limit=500'),
  ]);

  const sitemap = generateSiteMap({
    articles,
    events,
    pages,
    volunteerOpportunities,
  });

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
