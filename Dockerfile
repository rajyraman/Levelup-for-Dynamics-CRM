FROM node:12-stretch
WORKDIR /usr/src/levelup
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install -g gulp-cli --silent && npm install --silent && mv node_modules ../
COPY . .
ENV NODE_ENV=development
CMD npm run build:chrome