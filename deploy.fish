rsync -avzP ~/Code/app.closer.earth/* crocodile:/var/app/traditionaldreamfactory.com --exclude=.git --exclude=.next  --exclude=node_modules;
rsync -avzP ~/Code/traditionaldreamfactory.com/* crocodile:/var/app/traditionaldreamfactory.com --exclude=.git --exclude=.next  --exclude=node_modules;
ssh crocodile "cd /var/app/traditionaldreamfactory.com; npm i; node ./scripts/update_package.js; npm run build; pm2 restart traditionaldreamfactory.com;";
