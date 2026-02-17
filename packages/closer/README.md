# [Closer](https://closer.earth)

The platform for sovereign communities.

## Bug bounty program

If you find critical security gaps in our smart contract code, please reach sam@closer.earth.
We are offering a bounty of 1000CUSD + our eternal gratitute + free tickets for an event of your choice at [Traditional Dream Factory](https://traditionaldreamfactory.com/) (Maybe join us at the Regenerative Network State Summit?).
For smaller issues you can create tickets in our open source code repositories and we will happily consider an appropriate reward.

## UI

### Fundraising (Invest) page

The standardized fundraising page is available from the `closer` package. Any app can enable it.

1. **Feature flag**: Set `NEXT_PUBLIC_FEATURE_SUPPORT_US=true` in the app env. The backend `/config/fundraiser` must have `enabled: true`.

2. **Use the page**: Create `pages/invest.tsx` that uses the shared page and (optionally) app-specific SEO/CTA options:

```tsx
import { NextPageContext } from 'next';
import { getInvestPageInitialProps, InvestPage as CloserInvestPage, type InvestPageProps } from 'closer';

function InvestPage(props: InvestPageProps) {
  return <CloserInvestPage {...props} />;
}

InvestPage.getInitialProps = async (context: NextPageContext) => {
  const base = await getInvestPageInitialProps(context);
  return {
    ...base,
    investPageOptions: {
      canonicalUrl: 'https://yourapp.com/invest',
      shareUrl: 'https://yourapp.com/invest',
      ogImageUrl: 'https://...',
      twitterHandle: '@yourapp',
      dataroomHref: '/dataroom',
      scheduleCallHref: 'https://...',
      loanPackageHref: '/dataroom',
    },
  };
};

export default InvestPage;
```

If you omit `investPageOptions`, the page falls back to `NEXT_PUBLIC_APP_URL` for canonical/share URLs and default CTA paths.

### Tailwind

https://tailwindcss.com/docs

### Icons

https://heroicons.com/

## API

This platform is developed on top of the Closer API.

## Add new project

- Add nginx config to /etc/nginx/MYDOMAIN.ORG

```
server {
  server_name MYDOMAIN.ORG;
  access_log off;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $http_host;
    proxy_set_header X-NginX-Proxy true;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://localhost:PORT;
    proxy_redirect off;
    proxy_http_version 1.1;
  }
}
```

- Reload nginx `service nginx reload`
- Start the pm2 process

```
pm2 start --name "mydomain.co" npm -- start;
pm2 save
```

- Add an SSL cert

```
certbot --nginx -d MYDOMAIN.ORG
```

## [Licence](./LICENCE.md)

This software has been created by holders of Closer DAO.
You may use, reproduce & adapt this code for non-commercial use.

If you wish to use this software for commercial purposes (i.e if your village or community needs to sell tickets or members) you can contact team@closer.earth for information. If your community profits are owned by a non-profit, you can contact us for a commercial license for this entity (please send along all documentation).
