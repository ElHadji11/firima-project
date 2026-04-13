"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // shadcn/ui
// import ContextSelector from '@/components/ContextSelector';
import TranslationTab from '../components/TranslationTab';
import Header from '@/components/Header';
// import DocumentTab from '@/components/DocumentTab';

export default function Home() {
  const [context, setContext] = useState('Administration');

  return (
    <main className="min-h-screen bg-background text-foreground md:bg-primary/5">
      <Header /> {/* Simplistic Logo and Sign In */}

      <div className="mx-auto w-full max-w-7xl p-6 md:px-10 md:py-12">
        {/* The Core 2-Tab Structure as Cards */}
        <Tabs defaultValue="translate" className="mx-auto w-full max-w-6xl flex flex-col">
          <TabsList className="grid w-full grid-cols-2 gap-4 bg-transparent p-0 h-auto mb-20">
            <TabsTrigger
              value="translate"
              className="rounded-2xl border-2 border-border/50 bg-card/60 p-2  text-base font-semibold md:text-lg transition-all data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 hover:border-primary/50 hover:bg-card/80"
            >
              <div className="text-center space-y-2">
                <p className="text-2xl">📝</p>
                <p>Traduction Texte & Audio</p>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="summarize"
              className="rounded-2xl border-2 border-border/50 bg-card/60 p-2  text-base font-semibold md:text-lg transition-all data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10 hover:border-primary/50 hover:bg-card/80"
            >
              <div className="text-center space-y-2">
                <p className="text-2xl">📄</p>
                <p>Résumé de Document</p>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translate" className="mt-0 md:rounded-2xl md:border md:bg-card/70 md:p-6 md:shadow-lg">
            <TranslationTab context={context} />
          </TabsContent>
          {/* <TabsContent value="summarize">
            <DocumentTab context={context} />
          </TabsContent> */}
        </Tabs>

      </div>
    </main>
  );
}