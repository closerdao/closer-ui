rsync -avzP ~/Code/app.closer.earth/* ~/Code/traditionaldreamfactory.com/.local --exclude=.git --exclude=.next  --exclude=node_modules --exclude=.local;
rsync -avzP ~/Code/traditionaldreamfactory.com/* ~/Code/traditionaldreamfactory.com/.local --exclude=.git --exclude=.next  --exclude=node_modules --exclude=.local;
cd ~/Code/traditionaldreamfactory.com/.local;
npm i;
node ./scripts/update_package.js;
cd ~/Code/traditionaldreamfactory.com/;
