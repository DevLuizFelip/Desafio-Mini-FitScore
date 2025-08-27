

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// --- Validação das variáveis de ambiente ---
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and Anon Key must be provided in .env file');
}

// --- Configuração do Cliente Supabase ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// --- Lógica de Negócio (Services) ---

const calculateFitScore = (seniority: string, skills: string[]): { score: number; classification: string } => {
  const SENIORITY_POINTS: { [key: string]: number } = { 'Júnior': 10, 'Pleno': 20, 'Sênior': 30 };
  const SKILL_POINTS: { [key: string]: number } = { 'Next.js': 7, 'Supabase': 7, 'Docker': 7, 'TypeScript': 5, 'Node.js': 5 };
  const DEFAULT_SKILL_POINT = 3;

  let score = SENIORITY_POINTS[seniority] || 0;
  score += skills.reduce((acc, skillName) => acc + (SKILL_POINTS[skillName] || DEFAULT_SKILL_POINT), 0);

  const normalizedScore = Math.min(Math.round((score / 80) * 100), 100);

  let classification = "Fora do perfil";
  if (normalizedScore >= 75) classification = "Ideal";
  else if (normalizedScore >= 50) classification = "Promissor";
  
  return { score: normalizedScore, classification };
};

// --- Rotas da API (Controllers) ---

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'API is running' });
});

app.get('/api/skills', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('skills').select('id, name');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching skills", error: error.message });
  }
});

app.post('/api/candidates', async (req: Request, res: Response) => {
  const { name, email, phone, seniority, profile_summary, skillIds } = req.body;

  if (!name || !email || !seniority || !profile_summary || !skillIds || skillIds.length === 0) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const { data: skillsData, error: skillsError } = await supabase.from('skills').select('name').in('id', skillIds);
    if (skillsError) throw skillsError;
    
    const skillNames = skillsData.map(s => s.name);
    const { score, classification } = calculateFitScore(seniority, skillNames);

    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .insert({ name, email, phone, seniority, profile_summary, fit_score: score, fit_score_classification: classification, llm_analysis_status: 'pending' })
      .select().single();

    if (candidateError) throw candidateError;

    const candidateSkillsRelations = skillIds.map((skillId: string) => ({ candidate_id: candidateData.id, skill_id: skillId }));
    const { error: relationError } = await supabase.from('candidate_skills').insert(candidateSkillsRelations);

    if (relationError) throw relationError;

    res.status(201).json({ message: "Candidate created successfully!", data: candidateData });

  } catch (error: any) {
    if (error.code === '23505') {
        return res.status(409).json({ message: "Email already exists.", error: error.message });
    }
    res.status(500).json({ message: "Error creating candidate", error: error.message });
  }
});

app.get('/api/candidates', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('candidates')
            .select(`*, skills ( name )`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching candidates", error: error.message });
    }
});

// **ROTA DE MÉTRICAS CORRIGIDA E OTIMIZADA**
app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
        // Busca todos os dados de uma vez para evitar múltiplas chamadas
        const { data, error } = await supabase
            .from('candidates')
            .select('fit_score');

        if (error) throw error;

        const totalCandidates = data.length;
        const averageFitScore = totalCandidates > 0 
            ? data.reduce((acc, curr) => acc + (curr.fit_score || 0), 0) / totalCandidates 
            : 0;

        res.status(200).json({ totalCandidates, averageFitScore });

    } catch (error: any) {
        res.status(500).json({ message: "Error fetching metrics", error: error.message });
    }
});


app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});
