const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://www.traditionaldreamfactory.com';
import { api } from 'closer';

function generateSiteMap({ volunteerOpportunities, articles, lessons, events, members }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${EXTERNAL_DATA_URL}</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/roadmap</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/impact-map</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/blog</loc>
     </url>
     ${articles
       .map(({ slug }) => {
         return `
           <url>
               <loc>${EXTERNAL_DATA_URL}/blog/${slug}</loc>
           </url>
         `;
       })
     .join('')}
     ${lessons
       .map(({ slug }) => {
         return `
           <url>
               <loc>${EXTERNAL_DATA_URL}/learn/${slug}</loc>
           </url>
         `;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/events</loc>
     </url>
     ${events
       .map(({ slug }) => {
         return `
           <url>
               <loc>${EXTERNAL_DATA_URL}/events/${slug}</loc>
           </url>
         `;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/legal/privacy</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/login</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/members</loc>
     </url>
     ${members
       .map(({ slug }) => {
         return `
           <url>
               <loc>${EXTERNAL_DATA_URL}/members/${slug}</loc>
           </url>
         `;
       })
     .join('')}
     <url>
       <loc>${EXTERNAL_DATA_URL}/signup</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/subscriptions</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/token-sale</loc>
     </url>
     <url>
       <loc>${EXTERNAL_DATA_URL}/volunteer</loc>
     </url>
     ${volunteerOpportunities
       .map(({ slug }) => {
         return `
           <url>
               <loc>${EXTERNAL_DATA_URL}/volunteer/${slug}</loc>
           </url>
         `;
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
  const [volunteerOpportunities, articles, lessons, events, members] = await Promise.all([
    api.get('/volunteer?limit=500').then(action => action.data.results),
    api.get('/article?limit=500').then(action => action.data.results),
    api.get('/lesson?limit=500').then(action => action.data.results),
    api.get('/event?limit=500').then(action => action.data.results),
    api.get('/user?role=member&limit=500').then(action => action.data.results),
  ]);

  const sitemap = generateSiteMap({
    volunteerOpportunities,
    articles,
    lessons,
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
