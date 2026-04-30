FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=production npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/build ./build
COPY --from=build /app/config ./config
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/database ./database
COPY --from=build /app/data/data.json ./data/data.json
ENV NODE_ENV=production
EXPOSE 1337
CMD ["npm", "run", "start"]
