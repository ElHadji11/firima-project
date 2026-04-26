"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    LogIn,
    Crown,
    ArrowRight,
    MessageSquare,
    ShieldCheck,
    Mic
} from 'lucide-react';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';

interface WelcomeUserProps {
    onOpenProModal?: () => void;
}

export default function WelcomeUser({ onOpenProModal }: WelcomeUserProps) {
    const { isLoaded, isSignedIn, user } = useUser();

    // Évite les clignotements pendant le chargement de Clerk
    if (!isLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <div className="h-8 w-8 animate-pulse rounded-full bg-purple-500/20" />
            </div>
        );
    }

    // Vérification du statut Pro via les métadonnées Clerk
    const isPro = user?.publicMetadata?.plan === "pro";

    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/5 bg-[#1F2023]/60 p-8 text-center shadow-2xl backdrop-blur-xl md:p-12"
            >
                {/* Glow Effects */}
                <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
                <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />

                {/* Logo / Icon */}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1F2023] to-[#2E3033] shadow-inner ring-1 ring-white/10">
                    <Sparkles className="h-10 w-10 text-purple-400" />
                    {isPro && (
                        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg">
                            <Crown className="h-4 w-4 text-white" />
                        </div>
                    )}
                </div>

                {/* Dynamic Content based on Auth State */}
                {!isSignedIn ? (
                    // --- ÉTAT DÉCONNECTÉ ---
                    <>
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                            Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Firima</span>
                        </h1>
                        <p className="mx-auto mb-8 max-w-md text-white/60">
                            L'intelligence artificielle bilingue qui comprend les nuances du Wolof. Connectez-vous pour conserver votre historique et débloquer toutes les fonctionnalités.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <SignInButton mode="modal">
                                <button className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-gray-200 hover:scale-105 sm:w-auto">
                                    <LogIn size={18} />
                                    Se connecter
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-6 py-3 font-semibold text-white transition-all hover:bg-white/5 sm:w-auto">
                                    Créer un compte
                                </button>
                            </SignUpButton>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
                            <span className="flex items-center gap-1"><ShieldCheck size={16} /> Sécurisé</span>
                            <span className="flex items-center gap-1"><MessageSquare size={16} /> Historique cloud</span>
                        </div>
                    </>
                ) : (
                    // --- ÉTAT CONNECTÉ ---
                    <>
                        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                            Nanga def,
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> {user.firstName || 'ami'} </span>! 👋
                        </h1>

                        {!isPro ? (
                            // Connecté mais Gratuit -> Pousser vers PRO
                            <>
                                <p className="mx-auto mb-8 max-w-lg text-white/60">
                                    Vous utilisez actuellement la version gratuite. Passez à la vitesse supérieure pour profiter de l'expérience vocale complète.
                                </p>

                                <div className="mx-auto mb-8 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/5">
                                        <Mic className="text-blue-400" size={24} />
                                        <span className="text-sm font-medium text-white/80">Voix Firima premium</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/5">
                                        <Crown className="text-purple-400" size={24} />
                                        <span className="text-sm font-medium text-white/80">Traductions illimitées</span>
                                    </div>
                                </div>

                                <button
                                    onClick={onOpenProModal}
                                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(139,92,246,0.5)]"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Déverrouiller Firima Pro
                                        <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                                    </span>
                                    {/* Effet de brillance interne */}
                                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
                                </button>
                            </>
                        ) : (
                            // Connecté ET Pro -> Message de bienvenue premium
                            <>
                                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
                                    <Crown size={16} /> Membre Pro
                                </div>
                                <p className="mx-auto max-w-md text-white/60">
                                    Tous les systèmes sont opérationnels. Firima est prête à vous écouter et à traduire sans aucune limite. Que souhaitez-vous dire aujourd'hui ?
                                </p>
                            </>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
}