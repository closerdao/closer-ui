# [Closer](https://closer.earth)

The platform for sovereign communities.

## Bug bounty program

If you find critical security gaps in our smart contract code, please reach sam@closer.earth.
We are offering a bounty of 1000CUSD + our eternal gratitute + free tickets for an event of your choice at [Traditional Dream Factory](https://traditionaldreamfactory.com/) (Maybe join us at the Regenerative Network State Summit?).
For smaller issues you can create tickets in our open source code repositories and we will happily consider an appropriate reward.

## UI

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
