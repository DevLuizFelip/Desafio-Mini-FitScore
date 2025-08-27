// Salve este código como `backend/src/worker.ts`
// Para rodar: `npm run worker` (conforme script no package.json)

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// --- Validação das variáveis de ambiente ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error('Error: Supabase or Gemini API keys are not defined in .env file.');
  process.exit(1);
}

// --- Inicialização dos Clientes ---
const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- Lógica Principal do Worker ---

/**
 * Busca por um candidato com análise pendente no banco de dados.
 * @returns O primeiro candidato pendente encontrado ou null.
 */
async function findPendingCandidate() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('llm_analysis_status', 'pending')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = "No rows found"
    console.error('Error fetching pending candidate:', error);
    return null;
  }
  return data;
}

/**
 * Gera uma análise do perfil do candidato usando a API do Gemini.
 * @param summary O resumo do perfil do candidato.
 * @returns A análise gerada pela IA.
 */
async function generateAIAnalysis(summary: string): Promise<string> {
  const prompt = `
    Analise o seguinte resumo de perfil para um desenvolvedor de software.
    Seu objetivo é fornecer uma análise concisa (máximo de 100 palavras) sobre os pontos fortes, 
    possíveis áreas de especialização e o nível de experiência aparente.
    Seja direto e profissional.

    Resumo do Perfil: "${summary}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate AI analysis.');
  }
}

/**
 * Atualiza o status e a análise de um candidato no banco de dados.
 * @param candidateId O ID do candidato.
 * @param status O novo status.
 * @param analysis O texto da análise (opcional).
 */
async function updateCandidateStatus(candidateId: string, status: 'processing' | 'completed' | 'failed', analysis: string | null = null) {
  const { error } = await supabase
    .from('candidates')
    .update({ llm_analysis_status: status, llm_analysis: analysis })
    .eq('id', candidateId);

  if (error) {
    console.error(`Error updating candidate ${candidateId} to ${status}:`, error);
  }
}

/**
 * Função principal que processa a fila de candidatos.
 */
async function processQueue() {
  console.log('Worker checking for pending candidates...');
  const candidate = await findPendingCandidate();

  if (!candidate) {
    // Fila vazia, não faz nada.
    return;
  }

  console.log(`Processing candidate: ${candidate.name} (ID: ${candidate.id})`);

  // 1. Marca o candidato como "processando" para evitar que outro worker o pegue.
  await updateCandidateStatus(candidate.id, 'processing');

  try {
    // 2. Gera a análise com a IA.
    const analysisResult = await generateAIAnalysis(candidate.profile_summary);

    // 3. Salva o resultado e marca como "concluído".
    await updateCandidateStatus(candidate.id, 'completed', analysisResult);
    console.log(`Successfully analyzed candidate: ${candidate.name}`);

  } catch (error) {
    // 4. Em caso de erro, marca como "falhou".
    console.error(`Failed to process candidate ${candidate.id}:`, error);
    await updateCandidateStatus(candidate.id, 'failed');
  }
}

// --- Execução do Worker ---
const POLLING_INTERVAL_MS = 15000; // Verifica a fila a cada 15 segundos.

console.log('🚀 AI Analysis Worker started.');
console.log(`Polling database every ${POLLING_INTERVAL_MS / 1000} seconds.`);

// Executa imediatamente na primeira vez e depois no intervalo definido.
processQueue();
setInterval(processQueue, POLLING_INTERVAL_MS);
