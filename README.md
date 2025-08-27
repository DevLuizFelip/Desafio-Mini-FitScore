Desafio Técnico: Mini FitScore
Este repositório contém a solução completa para o desafio técnico "Mini FitScore", uma aplicação full stack para o registo e avaliação de candidatos, desenvolvida para demonstrar competências em desenvolvimento frontend, backend, arquitetura assíncrona e DevOps.

Links da Aplicação:

Frontend (Vercel): https://desafio-mini-fit-score.vercel.app

Backend (Render): https://desafio-mini-fitscore.onrender.com/api/health

🚀 Visão Geral
O Mini FitScore é um MVP (Minimum Viable Product) que permite a um avaliador:

Registar candidatos através de um formulário interativo, avaliando-os em três blocos: Performance, Energia e Cultura.

Calcular um "Fit Score" com base nas avaliações, classificando o candidato em categorias predefinidas.

Processar de forma assíncrona notificações e relatórios com base nos dados submetidos.

Visualizar todos os candidatos e métricas num dashboard com filtros e busca.

🛠️ Stack de Tecnologia
A escolha das tecnologias foi baseada diretamente nos requisitos da vaga, demonstrando familiaridade e alinhamento com a stack da empresa.

Frontend: Next.js (com App Router), TypeScript, Tailwind CSS, Shadcn/UI, Zustand, React Query (TanStack).

Backend: Node.js, Express.js, TypeScript.

Base de Dados: Supabase (PostgreSQL).

Processamento Assíncrono: Scripts Node.js a correr como Background Workers.

Bónus (Lógica Criativa): API do Google Gemini para análise de perfil por IA.

DevOps: Docker, Docker Compose, Vercel (Frontend Deploy), Render (Backend Deploy).

🏛️ Arquitetura da Solução
A aplicação é um monorepo com duas pastas principais: frontend e backend.

/frontend: Uma aplicação Next.js responsável por toda a interface do utilizador. A comunicação com o backend é feita através de chamadas HTTP (usando Axios e React Query).

/backend: Uma API RESTful construída com Node.js e Express. Lida com toda a lógica de negócio, cálculo de score e comunicação com a base de dados Supabase.

/worker.ts: Um processo independente (Background Worker) que executa as lógicas de negócio assíncronas em segundo plano, sem bloquear a experiência do utilizador.

🧠 Lógica de Negócio
Fórmula do FitScore
O Fit Score é calculado com base na avaliação de 0 a 100 em três blocos distintos:

Performance: Experiência, entregas e habilidades técnicas.

Energia: Disponibilidade, cumprimento de prazos e gestão de pressão.

Cultura: Alinhamento com os valores da LEGAL.

A fórmula final é a média aritmética dos três valores:
Fit Score = (Performance + Energia + Cultura) / 3

As classificações são aplicadas da seguinte forma:

Fit Altíssimo: Score >= 80

Fit Aprovado: Score >= 60 e <= 79

Fit Questionável: Score >= 40 e <= 59

Fora do Perfil: Score < 40

Solução Assíncrona
O processamento assíncrono é gerido por um Background Worker a correr na Render, que executa duas lógicas de negócio obrigatórias e uma lógica bónus.

Lógica 1 — Notificação de Resultado (Disparada por Evento):

Trigger: Após um novo candidato ser registado, o seu notification_status é definido como "pending".

Ação: O worker verifica a base de dados a cada 15 segundos. Se encontrar um candidato pendente, simula o envio de um e-mail com o resultado (Fit Aprovado, etc.) e atualiza o status para "sent".

Lógica 2 — Relatório de Aprovados (Disparada por Tempo):

Trigger: A cada 5 minutos (para fins de demonstração), o worker executa esta tarefa.

Ação: O worker consulta a base de dados por todos os candidatos com FitScore >= 80 ("Fit Altíssimo") e simula o envio de um relatório para um gestor, listando os nomes e scores.

Lógica Bónus — Análise com IA (Criativa):

Esta lógica pode ser executada num worker separado (ai-worker.ts).

Trigger: Após o registo, o llm_analysis_status é definido como "pending".

Ação: O worker envia o resumo do perfil do candidato para a API do Google Gemini e guarda a análise gerada na base de dados, atualizando o status para "completed".

⚙️ Como Executar o Projeto Localmente
Pré-requisitos:

Node.js (v18+)

Docker e Docker Compose

Uma conta no Supabase e uma API Key do Google AI Studio (Gemini).

Passos:

Clone o repositório:

git clone https://github.com/DevLuizFelip/Desafio-Mini-FitScore.git
cd Desafio-Mini-FitScore

Configure as Variáveis de Ambiente:

No ficheiro backend/.env, preencha as suas credenciais do Supabase e Gemini.

No ficheiro frontend/.env.local, certifique-se de que a NEXT_PUBLIC_API_URL aponta para http://localhost:3001/api.

Execute o Script SQL:

Copie o conteúdo do ficheiro database.sql e execute-o no "SQL Editor" do seu projeto Supabase.

Suba os contentores com Docker Compose:

Abra um terminal como administrador.

docker compose up --build

Aceda à aplicação:

Frontend: http://localhost:3000

Backend API: http://localhost:3001/api/health.