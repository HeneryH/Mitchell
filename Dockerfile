# Dockerfile for Bill Mitchell Auto Voice Scheduler

# Build Stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Receive API Key as a build argument
ARG API_KEY
# Set it as an environment variable so vite.config.ts can see it
ENV API_KEY=$API_KEY

RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
