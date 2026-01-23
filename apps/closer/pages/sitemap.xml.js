const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';
import { api } from 'closer';

function generateSiteMap({ volunteerOpportunities, articles, events, members }) {
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${EXTERNAL_DATA_URL}</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/roadmap</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy/commons-governance</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy/tragedy-myth</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy/commons-exclosure</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy/digital-commons</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/philosophy/shared-abundance</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/privacy-policy</loc>
       <lastmod>${today}</lastmod>
       <changefreq>yearly</changefreq>
       <priority>0.3</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/blog</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.8</priority>
     </url>
     ${articles
       .map(({ slug, updated }) => {
         const lastmod = updated ? new Date(updated).toISOString().split('T')[0] : today;
         return `
       <url>
         <loc>${EXTERNAL_DATA_URL}/blog/${slug}</loc>
         <lastmod>${lastmod}</lastmod>
         <changefreq>monthly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/events</loc>
       <lastmod>${today}</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     ${events
       .map(({ slug, updated }) => {
         const lastmod = updated ? new Date(updated).toISOString().split('T')[0] : today;
         return `
       <url>
         <loc>${EXTERNAL_DATA_URL}/events/${slug}</loc>
         <lastmod>${lastmod}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.6</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/login</loc>
       <changefreq>yearly</changefreq>
       <priority>0.4</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/signup</loc>
       <changefreq>yearly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/subscriptions</loc>
       <lastmod>${today}</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.7</priority>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/volunteer</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.7</priority>
     </url>
     ${volunteerOpportunities
       .map(({ slug, updated }) => {
         const lastmod = updated ? new Date(updated).toISOString().split('T')[0] : today;
         return `
       <url>
         <loc>${EXTERNAL_DATA_URL}/volunteer/${slug}</loc>
         <lastmod>${lastmod}</lastmod>
         <changefreq>weekly</changefreq>
         <priority>0.5</priority>
       </url>`;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/members</loc>
       <lastmod>${today}</lastmod>
       <changefreq>weekly</changefreq>
       <priority>0.5</priority>
     </url>
     ${members
       .map(({ slug }) => {
         return `
       <url>
         <loc>${EXTERNAL_DATA_URL}/members/${slug}</loc>
         <changefreq>monthly</changefreq>
         <priority>0.4</priority>
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
  const [volunteerOpportunities, articles, events, members] = await Promise.all([
    api.get('/volunteer?limit=500').then(action => action.data.results),
    api.get('/article?limit=500').then(action => action.data.results),
    api.get('/event?limit=500').then(action => action.data.results),
    api.get('/user?role=member&limit=500').then(action => action.data.results),
  ]);

  const sitemap = generateSiteMap({
    volunteerOpportunities,
    articles,
    events,
    members
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
