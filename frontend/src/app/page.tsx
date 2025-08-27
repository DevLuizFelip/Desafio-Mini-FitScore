
"use client";

import { useState } from 'react'; // CORREÇÃO: Removido 'useEffect' não utilizado
import { create } from 'zustand';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";

// --- Importação de Componentes ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// CORREÇÃO: Removido 'Users' não utilizado
import { Target, Check, ChevronsUpDown, Loader2, BarChart, Zap, Heart } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


// --- URL da API Backend ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Tipos e Store (Zustand) ---
type Skill = { id: string; name: string };
// CORREÇÃO: Criado um tipo específico para o payload do candidato
type CandidatePayload = {
  name: string;
  email: string;
  phone: string;
  seniority: string;
  skills: string[];
  performance: number;
  energy: number;
  culture: number;
};
type FormState = {
  name: string; email: string; phone: string; seniority: string; skills: Skill[];
  performance: number[]; energy: number[]; culture: number[];
  actions: {
    setData: (field: keyof Omit<FormState, 'actions' | 'skills'>, value: string | number[]) => void;
    addSkill: (skill: Skill) => void;
    removeSkill: (skillId: string) => void;
    reset: () => void;
  };
};

const useFormStore = create<FormState>((set) => ({
  name: '', email: '', phone: '', seniority: '', skills: [],
  performance: [50], energy: [50], culture: [50],
  actions: {
    setData: (field, value) => set({ [field]: value }),
    addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
    removeSkill: (skillId) => set((state) => ({ skills: state.skills.filter(s => s.id !== skillId) })),
    reset: () => set({ name: '', email: '', phone: '', seniority: '', skills: [], performance: [50], energy: [50], culture: [50] }),
  }
}));

// --- Funções de API ---
const fetchSkills = async (): Promise<Skill[]> => (await axios.get(`${API_URL}/skills`)).data;
// CORREÇÃO: Aplicado o tipo específico ao payload
const createCandidate = async (candidateData: CandidatePayload) => (await axios.post(`${API_URL}/candidates`, candidateData)).data;

// --- Componentes ---
function SkillsCombobox({ availableSkills, isLoading }: { availableSkills: Skill[], isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedSkills = useFormStore((state) => state.skills);
  const { addSkill, removeSkill } = useFormStore((state) => state.actions);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between min-h-[40px] h-auto"><div className="flex flex-wrap gap-1">{selectedSkills.length > 0 ? selectedSkills.map(s => (<span key={s.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{s.name}</span>)) : "Selecione as skills..."}</div><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Buscar skill..." /><CommandEmpty>{isLoading ? "Carregando..." : "Nenhuma skill encontrada."}</CommandEmpty><CommandGroup>{availableSkills?.map((skill) => { const isSelected = selectedSkills.some(s => s.id === skill.id); return (<CommandItem key={skill.id} onSelect={() => { if (isSelected) removeSkill(skill.id); else addSkill(skill);}}><Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />{skill.name}</CommandItem>);})}</CommandGroup></Command></PopoverContent>
    </Popover>
  );
}

function CandidateForm() {
  const formData = useFormStore((state) => state);
  const { setData, reset } = useFormStore((state) => state.actions);

  const { data: skills, isLoading: isLoadingSkills } = useQuery({ queryKey: ['skills'], queryFn: fetchSkills });

  const mutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => { toast.success("Candidato cadastrado com sucesso!"); reset(); },
    onError: (error) => { toast.error("Falha ao cadastrar. Tente novamente."); console.error(error); }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.skills.length === 0) { toast.warning("Selecione pelo menos uma skill."); return; }
    
    const payload: CandidatePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        seniority: formData.seniority,
        skills: formData.skills.map(s => s.id),
        performance: formData.performance[0],
        energy: formData.energy[0],
        culture: formData.culture[0],
    };
    mutation.mutate(payload);
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader><CardTitle className="text-2xl text-gray-800">Formulário FitScore</CardTitle><CardDescription>Preencha os dados para avaliar o candidato.</CardDescription></CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={formData.name} onChange={e => setData('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={e => setData('email', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={formData.phone} onChange={e => setData('phone', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="seniority">Senioridade</Label><Select value={formData.seniority} onValueChange={value => setData('seniority', [value])} required><SelectTrigger id="seniority"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Júnior">Júnior</SelectItem><SelectItem value="Pleno">Pleno</SelectItem><SelectItem value="Sênior">Sênior</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Skills</Label><SkillsCombobox availableSkills={skills || []} isLoading={isLoadingSkills} /></div>
          
          <div className="space-y-6 border-t pt-6">
            <div className="space-y-3">
                <Label className="flex items-center gap-2"><BarChart className="h-4 w-4" /> Performance (Experiência, Entregas, Habilidades)</Label>
                <Slider value={formData.performance} onValueChange={value => setData('performance', value)} />
            </div>
            <div className="space-y-3">
                <Label className="flex items-center gap-2"><Zap className="h-4 w-4" /> Energia (Disponibilidade, Prazos, Pressão)</Label>
                <Slider value={formData.energy} onValueChange={value => setData('energy', value)} />
            </div>
            <div className="space-y-3">
                <Label className="flex items-center gap-2"><Heart className="h-4 w-4" /> Cultura (Valores da LEGAL)</Label>
                <Slider value={formData.culture} onValueChange={value => setData('culture', value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-gray-50 p-6 rounded-b-lg">
          <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
            {mutation.isPending ? "Salvando..." : "Calcular e Salvar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function FormPage() {
  return (<main className="container mx-auto p-4 flex flex-col items-center"><div className="w-full max-w-4xl"><CandidateForm /></div></main>);
}
