FROM node:10.13-alpine
WORKDIR /usr/src/levelup
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install -g gulp-cli --silent && npm install --silent && mv node_modules ../
COPY . .

CMD npm run chrome