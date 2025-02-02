# frontend/Dockerfile
FROM node:22.13.1-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV WDS_SOCKET_PORT=0

CMD ["npm", "start"]