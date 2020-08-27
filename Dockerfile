# install dependencies
FROM node:dubnium-alpine
WORKDIR /app-src

COPY package.json package-lock.json ./
COPY src ./src
COPY build-stations.js ./build-stations.js

RUN npm install
RUN npm run build

USER node

CMD ["npm", "start"]
