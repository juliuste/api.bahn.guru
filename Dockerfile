# install dependencies
FROM node:dubnium-alpine
WORKDIR /app-src

COPY package.json package-lock.json ./
COPY src ./src
RUN npm install

USER node

CMD ["npm", "start"]
