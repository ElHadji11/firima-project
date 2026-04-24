"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // shadcn/ui
import { Languages, BotMessageSquare } from 'lucide-react';

// import Header from '@/components/Header';
import TranslationTab from '../components/TranslationTab';
import ChatTab from '../components/ChatTab'; // Décommente ceci quand tu auras créé ton composant ChatTab

export default function Home() {
  const [context, setContext] = useState('Administration'); // On garde ton state intact

  return (
    <main className="flex-1 bg-background text-foreground md:bg-accent/5">

      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 md:px-10 md:py-8 flex flex-col items-center">


        <ChatTab />


      </div>
    </main>
  );
}