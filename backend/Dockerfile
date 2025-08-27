# Dockerfile para o Backend (Node.js + Express + TypeScript)
# Salve este arquivo como `backend/Dockerfile`

# --- Estágio 1: Build ---
# Usamos uma imagem Node.js completa para instalar dependências e compilar o TypeScript.
FROM node:18 AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de pacotes
COPY package*.json ./

# Instala as dependências de produção e desenvolvimento
RUN npm install

# Copia todo o código-fonte do backend
COPY . .

# Compila o código TypeScript para JavaScript
RUN npm run build

# --- Estágio 2: Produção ---
# Usamos uma imagem 'alpine' que é muito menor, para um container de produção mais leve.
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia apenas os arquivos de manifesto de pacotes novamente
COPY package*.json ./

# Instala APENAS as dependências de produção
RUN npm install --omit=dev

# Copia os arquivos compilados do estágio de 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Expõe a porta em que a API estará rodando
EXPOSE 3001

# O comando para iniciar o servidor da API quando o container for executado
CMD [ "node", "dist/index.js" ]
