FROM node:20-alpine AS builder

WORKDIR /app

ARG EXPO_PUBLIC_API_URL=https://caja-negra-psico-back.wkhbmg.easypanel.host
ARG EXPO_PUBLIC_API_URL_WEB=https://caja-negra-psico-back.wkhbmg.easypanel.host
ARG EXPO_PUBLIC_API_URL_NATIVE=https://caja-negra-psico-back.wkhbmg.easypanel.host

ENV CI=true
ENV EXPO_NO_TELEMETRY=1
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL_WEB=$EXPO_PUBLIC_API_URL_WEB
ENV EXPO_PUBLIC_API_URL_NATIVE=$EXPO_PUBLIC_API_URL_NATIVE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
