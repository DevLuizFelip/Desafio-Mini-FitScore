// Salve este código como `frontend/src/app/dashboard/page.tsx`

"use client";

import { useState, useMemo } from 'react';
// CORREÇÃO: Removidos imports não utilizados (QueryClient, QueryClientProvider, Link)
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// --- Importação de Componentes UI (Shadcn/UI) ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, Search, SlidersHorizontal, Bot, Mail, Phone, User } from 'lucide-react';

// --- URL da API Backend ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// --- Tipos ---
type Skill = { name: string };
type Candidate = {
  id: string; name: string; email: string; phone?: string; seniority: string;
  fit_score: number; fit_score_classification: string;
  llm_analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  llm_analysis?: string; skills: Skill[]; profile_summary?: string;
};
type Metrics = { totalCandidates: number; averageFitScore: number; };

// --- Funções de API ---
const fetchMetrics = async (): Promise<Metrics> => (await axios.get(`${API_URL}/metrics`)).data;
const fetchCandidates = async (): Promise<Candidate[]> => (await axios.get(`${API_URL}/candidates`)).data;

// --- Componentes do Dashboard ---

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardHeader() {
    const { data, isLoading } = useQuery<Metrics>({ queryKey: ['metrics'], queryFn: fetchMetrics });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[108px]" />
                <Skeleton className="h-[108px]" />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <MetricCard title="Total de Candidatos" value={data?.totalCandidates ?? 0} icon={Users} />
            <MetricCard title="Média FitScore" value={Math.round(data?.averageFitScore ?? 0)} icon={Star} />
        </div>
    );
}

function CandidateTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');
  const { data: candidates, isLoading } = useQuery<Candidate[]>({ queryKey: ['candidates'], queryFn: fetchCandidates, refetchInterval: 5000 });

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter(c => {
      const searchMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const classificationMatch = classificationFilter === 'all' || c.fit_score_classification === classificationFilter;
      return searchMatch && classificationMatch;
    });
  }, [candidates, searchTerm, classificationFilter]);

  const getStatusBadge = (status: Candidate['llm_analysis_status']) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Analisado</Badge>;
      case 'pending': return <Badge variant="secondary">Pendente</Badge>;
      case 'processing': return <Badge variant="outline">Analisando...</Badge>;
      case 'failed': return <Badge variant="destructive">Falhou</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Candidatos Avaliados</CardTitle>
        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar por nome ou email..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative w-full md:w-[200px]">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Select value={classificationFilter} onValueChange={setClassificationFilter}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Filtrar por classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Ideal">Ideal</SelectItem>
                <SelectItem value="Promissor">Promissor</SelectItem>
                <SelectItem value="Fora do perfil">Fora do perfil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidato</TableHead>
              <TableHead>Senioridade</TableHead>
              <TableHead className="text-center">FitScore</TableHead>
              <TableHead className="text-center">Análise IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                    </TableRow>
                ))
            ) : filteredCandidates.length > 0 ? (
              filteredCandidates.map(candidate => (
                <Dialog key={candidate.id}>
                  <DialogTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-gray-500">{candidate.email}</div>
                      </TableCell>
                      <TableCell>{candidate.seniority}</TableCell>
                      <TableCell className="text-center font-semibold text-blue-600">{candidate.fit_score}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(candidate.llm_analysis_status)}</TableCell>
                    </TableRow>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{candidate.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" /><span className="text-sm">{candidate.email}</span></div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /><span className="text-sm">{candidate.phone || 'Não informado'}</span></div>
                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span className="text-sm">{candidate.seniority}</span></div>
                            <div className="flex items-center gap-2"><Star className="h-4 w-4 text-gray-500" /><span className="text-sm font-bold">{candidate.fit_score}pts - {candidate.fit_score_classification}</span></div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map(skill => <Badge key={skill.name} variant="secondary">{skill.name}</Badge>)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Resumo do Perfil</h3>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{candidate.profile_summary}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Bot /> Análise da IA</h3>
                            <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md min-h-[80px]">
                                {candidate.llm_analysis_status === 'completed' ? candidate.llm_analysis : <span className="text-gray-500">Análise pendente...</span>}
                            </div>
                        </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Nenhum candidato encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Componente Principal da Página ---
export default function DashboardPage() {
  return (
    <main className="container mx-auto p-4">
        <DashboardHeader />
        <CandidateTable />
    </main>
  );
}
