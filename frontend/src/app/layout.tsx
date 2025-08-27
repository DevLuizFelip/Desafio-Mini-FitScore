// Salve este código como `frontend/src/app/layout.tsx`

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./providers"; // Componente cliente para os providers

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mini FitScore",
  description: "Desafio técnico para avaliação de candidatos.",
};

// --- Componente de Cabeçalho para Navegação ---
function Header() {
    // NOTA: O uso de `usePathname` aqui exigiria que este componente fosse um Client Component.
    // Para manter o layout como um Server Component, a lógica de "link ativo" pode ser
    // adicionada no componente Providers ou o Header pode ser movido para dentro dele.
    // Por simplicidade, aqui não temos a estilização de link ativo.
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                    Mini FitScore
                </Link>
                <div className="space-x-4">
                    <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        Formulário
                    </Link>
                    <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                        Dashboard
                    </Link>
                </div>
            </nav>
        </header>
    )
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-gray-50 font-sans`}>
        <Providers>
          <Header />
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}

// --- Crie um novo arquivo `frontend/src/app/providers.tsx` ---
// Este arquivo é necessário para encapsular os providers que usam hooks (são 'use client')
// sem transformar todo o layout em um client component.

/*
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
  );
}
*/
