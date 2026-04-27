"use client";
import { Suspense } from 'react';
import ChatTab from '../components/ChatTab'; // Décommente ceci quand tu auras créé ton composant ChatTab
import LoadingState from '@/components/LoadingState';

export default function Home() {

  return (
    <main className="flex-1 bg-background text-foreground overflow-hidden">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 md:px-10 md:py-8 flex flex-col items-center">
        <Suspense fallback={<LoadingState />}>
          <ChatTab />
        </Suspense>
      </div>
    </main>
  );
}