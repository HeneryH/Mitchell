  # Build Stage
  FROM node:20-alpine as builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  ARG API_KEY
  ENV API_KEY=$API_KEY
  RUN npm run build
  
  # Production Stage
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install --production
  COPY --from=builder /app/dist ./dist
  COPY server.js .
  
  EXPOSE 8080
  CMD ["node", "server.js"]
