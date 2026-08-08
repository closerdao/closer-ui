const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';
import { api } from 'closer';

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const loc = (path = '') => escapeXml(`${EXTERNAL_DATA_URL}${path}`);

const fetchResults = async (path) => {
  try {
    const response = await api.get(path);
    return Array.isArray(response?.data?.results) ? response.data.results : [];
  } catch (err) {
    return [];
  }
};

function generateSiteMap({ volunteerOpportunities, articles, events, members, pages }) {
  const today = new Date().toISOString().split('T')[0];

  const lastmodOf = (updated) =>
    updated ? new Date(updated).toISOString().split('T')[0] : today;

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${loc()}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${loc('/roadmap')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${loc('/philosophy')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${loc('/philosophy/commons-governance')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/philosophy/tragedy-myth')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/philosophy/commons-exclosure')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/philosophy/digital-commons')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/philosophy/shared-abundance')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/privacy-policy')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${loc('/blog')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     ${articles
       .map(({ slug, updated }) => {
         return `
       <url>
         <loc>${loc(`/blog/${slug}`)}</loc>
         <lastmod>${lastmodOf(updated)}</lastmod>
         <changefreq>monthly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${loc('/events')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     ${events
       .map(({ slug, updated }) => {
         return `
       <url>
         <loc>${loc(`/events/${slug}`)}</loc>
         <lastmod>${lastmodOf(updated)}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${loc('/login')}</loc>
       <changefreq>yearly</changefreq>
       <priority>0.4</priority>
     </url>
     <url>
       <loc>${loc('/signup')}</loc>
       <changefreq>yearly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${loc('/subscriptions')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${loc('/volunteer')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.7</priority>
     </url>
     ${volunteerOpportunities
       .map(({ slug, updated }) => {
         return `
       <url>
         <loc>${loc(`/volunteer/${slug}`)}</loc>
         <lastmod>${lastmodOf(updated)}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.5</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${loc('/members')}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.5</priority>
     </url>
     ${members
       .map(({ slug }) => {
         return `
       <url>
         <loc>${loc(`/members/${slug}`)}</loc>
         <changefreq>monthly</changefreq>
         <priority>0.4</priority>
       </url>`;
       })
     .join('')}
     ${pages
       .filter(({ slug }) => slug)
       .map(({ slug, updated }) => {
         return `
       <url>
         <loc>${loc(`/${slug}`)}</loc>
         <lastmod>${lastmodOf(updated)}</lastmod>
         <changefreq>monthly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
     .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  // We generate the XML sitemap with the posts data
  const [volunteerOpportunities, articles, events, members, pages] = await Promise.all([
    fetchResults('/volunteer?limit=500'),
    fetchResults('/article?limit=500'),
    fetchResults('/event?limit=500'),
    fetchResults('/user?role=member&limit=500'),
    fetchResults('/page?limit=500'),
  ]);

  const sitemap = generateSiteMap({
    volunteerOpportunities,
    articles,
    events,
    members,
    pages,
  });

  res.setHeader('Content-Type', 'text/xml');
  // we send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
