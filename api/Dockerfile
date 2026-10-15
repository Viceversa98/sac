FROM node:22-slim
WORKDIR /app

# WHY: Cloud Run builds this folder alone. The Vue app and the build kit are not in the image.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY data ./data
COPY firestore.rules ./firestore.rules

RUN npm run build && npm prune --omit=dev

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
