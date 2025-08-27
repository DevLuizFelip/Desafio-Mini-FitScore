# Dockerfile para o Frontend (Next.js)
# Salve este arquivo como `frontend/Dockerfile`

# --- Estágio 1: Dependências ---
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# --- Estágio 2: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia o resto do código-fonte
COPY . .
# Seta a variável de ambiente para não coletar telemetria anônima
ENV NEXT_TELEMETRY_DISABLED 1
# Executa o build de produção do Next.js
RUN npm run build

# --- Estágio 3: Produção ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria um usuário e grupo 'nextjs' para não rodar como root (boa prática de segurança)
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Copia os artefatos de build do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Muda o dono dos arquivos para o usuário 'nextjs'
RUN chown -R nextjs:nextjs .

# Seta o usuário para rodar a aplicação
USER nextjs

EXPOSE 3000

ENV PORT 3000

# O comando para iniciar o servidor Next.js em produção
CMD ["node", "server.js"]
