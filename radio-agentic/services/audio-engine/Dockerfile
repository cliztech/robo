FROM node:20-alpine
RUN apk add --no-cache ffmpeg bash
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
CMD ["node", "src/index.ts"]
