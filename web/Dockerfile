FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# WHY: Vite inlines this at build time. Local `npm run dev` leaves it empty and keeps the /api proxy.
ARG VITE_API_BASE=https://sac-git-811818892931.asia-southeast1.run.app
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
