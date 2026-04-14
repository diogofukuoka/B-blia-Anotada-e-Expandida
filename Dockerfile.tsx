# Estágio 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Runtime
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
# Instala apenas dependências de produção
RUN npm install --production
# Copia o build do estágio anterior
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.ts ./server.ts
# Copia outros arquivos necessários (se houver)
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.ts"]