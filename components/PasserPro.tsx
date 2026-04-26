"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    Zap,
    Crown,
    Mic,
    Infinity as InfinityIcon,
    Key,
    ArrowRight,
    Loader2,
    X,
    Lock
} from 'lucide-react';
import { useAuth, SignInButton } from '@clerk/nextjs';

interface PasserProProps {
    isOpen: boolean;
    onClose: () => void;
    authReason?: 'limit_reached' | 'file_upload' | null;
    onNewChat?: () => void;
}

export default function PasserPro({ isOpen, onClose, authReason, onNewChat }: PasserProProps) {
    const [loading, setLoading] = useState(false);
    const { isSignedIn } = useAuth();

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/checkout', { method: 'POST' });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url; // Redirection vers PayDunya
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Erreur de redirection:", error);
            alert("Impossible de lancer le paiement. Réessayez plus tard.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay avec flou Firima */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal World Class */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-[70] w-[95vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0F0F12] p-8 shadow-[0_0_50px_rgba(139,92,246,0.15)]"
                    >
                        {/* Effet de lueur en arrière-plan */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-600/10 blur-[80px]" />
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />

                        {/* Bouton Fermer */}
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 text-white/30 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Header */}
                        <div className="relative mb-8 flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20">
                                {authReason === 'file_upload' ? <Lock className="text-white" size={32} /> : <Crown className="text-white" size={32} />}
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                                {authReason === 'file_upload' ? (
                                    <>Analyse d'image <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Premium</span></>
                                ) : !isSignedIn ? (
                                    <>Limite de session <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Atteinte</span></>
                                ) : (
                                    <>Passez au niveau <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Pro</span></>
                                )}
                            </h2>
                            <p className="mt-2 text-white/50 text-sm">
                                {authReason === 'file_upload'
                                    ? "Pour analyser des images avec notre IA, veuillez vous connecter ou passer Pro."
                                    : !isSignedIn
                                        ? "Vous avez atteint la limite de 3 messages. Connectez-vous ou passez Pro pour continuer."
                                        : "Libérez toute la puissance de Firima et traduisez sans limites."}
                            </p>
                        </div>

                        {/* Liste des avantages Premium */}
                        <div className="space-y-4 mb-8">
                            <FeatureItem
                                icon={<InfinityIcon className="text-purple-400" size={20} />}
                                title="Traductions illimitées"
                                desc="Plus de limites journalières, discutez sans fin."
                            />
                            <FeatureItem
                                icon={<Mic className="text-blue-400" size={20} />}
                                title="Mode Voix Firima"
                                desc="Accès exclusif à la synthèse vocale ultra-réaliste."
                            />
                            <FeatureItem
                                icon={<Key className="text-green-400" size={20} />}
                                title="Support BYOK"
                                desc="Branchez vos propres clés API pour un contrôle total."
                            />
                            <FeatureItem
                                icon={<Zap className="text-yellow-400" size={20} />}
                                title="Réponses Prioritaires"
                                desc="Accès aux serveurs Gemini les plus rapides."
                            />
                        </div>

                        {/* Prix et Action */}
                        <div className="relative rounded-[2rem] bg-white/5 p-6 border border-white/5 text-center">
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-white">5.000 FCFA</span>
                                <span className="text-white/40"> / mois</span>
                            </div>

                            {/* Action Button */}
                            {!isSignedIn ? (
                                <SignInButton mode="modal">
                                    <button className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Se connecter gratuitement
                                        <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                                    </button>
                                </SignInButton>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={22} />
                                    ) : (
                                        <>
                                            Continuer vers PayDunya
                                            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                                        </>
                                    )}
                                </button>
                            )}

                            {authReason === 'limit_reached' && onNewChat && (
                                <button
                                    onClick={onNewChat}
                                    className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/20 bg-transparent px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
                                >
                                    Ouvrir un nouveau chat vierge
                                </button>
                            )}

                            <p className="mt-4 text-[10px] uppercase tracking-widest text-white/30">
                                Paiement sécurisé via Wave, Orange Money ou Carte
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-semibold text-white">{title}</h4>
                <p className="text-xs text-white/40">{desc}</p>
            </div>
        </div>
    );
}