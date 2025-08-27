// Salve este código como `frontend/src/app/page.tsx`

"use client";

import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";

// --- Importação de Componentes UI (Shadcn/UI) ---
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Target, Check, ChevronsUpDown, Loader2 } from 'lucide-react';

// --- URL da API Backend ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Tipos ---
type Skill = { id: string; name: string };
type FormState = {
  name: string;
  email: string;
  phone: string;
  seniority: string;
  skills: Skill[];
  profile_summary: string;
  actions: {
    // CORREÇÃO: Removido o tipo 'any'
    setData: (field: keyof Omit<FormState, 'actions' | 'skills'>, value: string) => void;
    addSkill: (skill: Skill) => void;
    removeSkill: (skillId: string) => void;
    reset: () => void;
  };
};

// --- Store com Zustand ---
const useFormStore = create<FormState>((set) => ({
  name: '', email: '', phone: '', seniority: '', skills: [], profile_summary: '',
  actions: {
    setData: (field, value) => set({ [field]: value }),
    addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
    removeSkill: (skillId) => set((state) => ({ skills: state.skills.filter(s => s.id !== skillId) })),
    reset: () => set({ name: '', email: '', phone: '', seniority: '', skills: [], profile_summary: '' }),
  }
}));

// --- Funções de API ---
const fetchSkills = async (): Promise<Skill[]> => {
  const { data } = await axios.get(`${API_URL}/skills`);
  return data;
};

const createCandidate = async (candidateData: Omit<FormState, 'actions' | 'skills'> & { skillIds: string[] }) => {
  const { data } = await axios.post(`${API_URL}/candidates`, candidateData);
  return data;
};

// --- Componentes ---
function SkillsCombobox({ availableSkills, isLoading }: { availableSkills: Skill[], isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  const selectedSkills = useFormStore((state) => state.skills);
  const { addSkill, removeSkill } = useFormStore((state) => state.actions);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between min-h-[40px] h-auto">
          <div className="flex flex-wrap gap-1">
            {selectedSkills.length > 0 ? selectedSkills.map(s => (
              <span key={s.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{s.name}</span>
            )) : "Selecione as skills..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar skill..." />
          <CommandEmpty>{isLoading ? "Carregando..." : "Nenhuma skill encontrada."}</CommandEmpty>
          <CommandGroup>
            {availableSkills?.map((skill) => {
              const isSelected = selectedSkills.some(s => s.id === skill.id);
              return (
                <CommandItem key={skill.id} onSelect={() => {
                  // CORREÇÃO: Ternário reescrito como if/else para seguir a regra do linter
                  if (isSelected) {
                    removeSkill(skill.id);
                  } else {
                    addSkill(skill);
                  }
                }}>
                  <Check className={`mr-2 h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  {skill.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CandidateForm() {
  const formData = useFormStore((state) => state);
  const { setData, reset } = useFormStore((state) => state.actions);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fields = [formData.name, formData.email, formData.seniority, formData.profile_summary];
    const filledFields = fields.filter(f => f).length + (formData.skills.length > 0 ? 1 : 0);
    setProgress((filledFields / 5) * 100);
  }, [formData]);

  const { data: skills, isLoading: isLoadingSkills } = useQuery({ queryKey: ['skills'], queryFn: fetchSkills });

  const mutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => { toast.success("Candidato cadastrado com sucesso!"); reset(); },
    onError: (error) => { toast.error("Falha ao cadastrar. Tente novamente."); console.error(error); }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.skills.length === 0) { toast.warning("Selecione pelo menos uma skill."); return; }
    // CORREÇÃO: Removida a variável 'actions' não utilizada
    const { skills, ...payload } = formData;
    const skillIds = skills.map(s => s.id);
    mutation.mutate({ ...payload, skillIds });
  };

  return (
    <Card className="w-full shadow-lg border-gray-200">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-md"><Users className="h-6 w-6 text-blue-600" /></div>
          <div>
            <CardTitle className="text-2xl text-gray-800">Formulário FitScore</CardTitle>
            <CardDescription>Preencha os dados para avaliar o candidato.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label>Progresso</Label>
            <Progress value={progress} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={formData.name} onChange={e => setData('name', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={e => setData('email', e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={formData.phone} onChange={e => setData('phone', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="seniority">Senioridade</Label><Select value={formData.seniority} onValueChange={value => setData('seniority', value)} required><SelectTrigger id="seniority"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Júnior">Júnior</SelectItem><SelectItem value="Pleno">Pleno</SelectItem><SelectItem value="Sênior">Sênior</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Skills</Label><SkillsCombobox availableSkills={skills || []} isLoading={isLoadingSkills} /></div>
          <div className="space-y-2"><Label htmlFor="summary">Resumo do Perfil</Label><Textarea id="summary" value={formData.profile_summary} onChange={e => setData('profile_summary', e.target.value)} className="min-h-[120px]" required /></div>
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

// --- Componente Principal da Página ---
export default function FormPage() {
  return (
    <main className="container mx-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-4xl">
            <CandidateForm />
        </div>
    </main>
  );
}
