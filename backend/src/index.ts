
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
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// --- Lógica de Negócio (Services) ---

// **NOVA LÓGICA DE CÁLCULO DO FITSCORE**
const calculateFitScore = (formData: { performance: number, energy: number, culture: number }): { score: number; classification: string } => {
  // Simplesmente somamos os pontos dos 3 blocos (cada um de 0-100) e tiramos a média.
  const score = Math.round((formData.performance + formData.energy + formData.culture) / 3);

  let classification: string;
  if (score >= 80) {
    classification = "Fit Altíssimo";
  } else if (score >= 60) {
    classification = "Fit Aprovado";
  } else if (score >= 40) {
    classification = "Fit Questionável";
  } else {
    classification = "Fora do Perfil";
  }
  
  return { score, classification };
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
  // Atualizado para receber os novos campos
  const { name, email, phone, seniority, skills: skillIds, performance, energy, culture } = req.body;

  if (!name || !email || !seniority || !skillIds || skillIds.length === 0 || performance === undefined || energy === undefined || culture === undefined) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const { score, classification } = calculateFitScore({ performance, energy, culture });

    const { data: candidateData, error: candidateError } = await supabase
      .from('candidates')
      .insert({ 
        name, email, phone, seniority, 
        fit_score: score, 
        fit_score_classification: classification,
        // Adiciona o status inicial para a Lógica 1 de notificação
        notification_status: 'pending' 
      })
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

app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from('candidates').select('fit_score');
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
