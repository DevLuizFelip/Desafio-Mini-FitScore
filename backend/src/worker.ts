
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase keys are not defined in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- LÓGICA 1: Notificação de Resultado (Disparada por evento) ---
async function processCandidateNotifications() {
  console.log('[Worker] Verificando candidatos para notificar...');
  
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select('id, name, email, fit_score_classification')
    .eq('notification_status', 'pending')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Worker] Erro ao buscar candidato pendente:', error);
    return;
  }

  if (!candidate) {
    return; // Fila vazia
  }

  console.log(`[Worker] Processando notificação para: ${candidate.name}`);
  
  // Simula o envio de uma notificação (ex: email)
  console.log(`--- SIMULANDO ENVIO DE EMAIL ---`);
  console.log(`Para: ${candidate.email}`);
  console.log(`Assunto: Resultado da sua Avaliação FitScore`);
  console.log(`Olá ${candidate.name}, o resultado da sua avaliação foi: ${candidate.fit_score_classification}.`);
  console.log(`---------------------------------`);

  // Atualiza o status para 'sent'
  const { error: updateError } = await supabase
    .from('candidates')
    .update({ notification_status: 'sent' })
    .eq('id', candidate.id);

  if (updateError) {
    console.error(`[Worker] Erro ao atualizar status do candidato ${candidate.id}:`, updateError);
  } else {
    console.log(`[Worker] Notificação para ${candidate.name} processada com sucesso.`);
  }
}

// --- LÓGICA 2: Relatório de Aprovados (Disparada por tempo) ---
async function generateApprovedReport() {
    console.log('[Reporter] Gerando relatório de aprovados...');

    const { data, error } = await supabase
        .from('candidates')
        .select('name, email, fit_score')
        .gte('fit_score', 80); // gte = Greater Than or Equal (>=)

    if (error) {
        console.error('[Reporter] Erro ao consultar candidatos para o relatório:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('[Reporter] Nenhum candidato com Fit Altíssimo encontrado para o relatório.');
        return;
    }

    // Simula o envio de um relatório para um gestor
    console.log(`\n--- SIMULANDO RELATÓRIO PARA O GESTOR ---`);
    console.log(`Data: ${new Date().toISOString()}`);
    console.log(`Candidatos com Fit Altíssimo (Score >= 80):`);
    data.forEach(candidate => {
        console.log(`  - Nome: ${candidate.name}, Email: ${candidate.email}, Score: ${candidate.fit_score}`);
    });
    console.log(`-----------------------------------------\n`);
}

// --- Execução dos Workers ---
const NOTIFICATION_INTERVAL_MS = 15000; // Lógica 1 roda a cada 15 segundos
const REPORT_INTERVAL_MS = 1000 * 60 * 5; // Lógica 2 roda a cada 5 minutos (para teste)

console.log('🚀 Workers de Lógica de Negócio iniciados.');

// Inicia a Lógica 1
setInterval(processCandidateNotifications, NOTIFICATION_INTERVAL_MS);

// Inicia a Lógica 2
setInterval(generateApprovedReport, REPORT_INTERVAL_MS);
