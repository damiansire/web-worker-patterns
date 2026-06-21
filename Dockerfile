# Stage 1: Build the Angular app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built app from previous stage (Angular outputs to dist/web-worker-patterns/browser)
COPY --from=build /app/dist/web-worker-patterns/browser /usr/share/nginx/html

# SPA: serve index.html for all routes.
# Las cabeceras COOP/COEP son OBLIGATORIAS: sin ellas el documento NO queda
# cross-origin-isolated y SharedArrayBuffer/Atomics no comparten memoria (la demo 12
# cae al backend simulado). Las demás son hardening de base (hay sinks [innerHTML] en
# los code-block): nosniff, anti-clickjacking, referrer y una CSP restrictiva que igual
# permite blob: para los workers.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
