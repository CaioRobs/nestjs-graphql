FROM node:20-alpine AS base
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["./init.sh"]
