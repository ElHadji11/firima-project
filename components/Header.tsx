"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Zap, Loader2 } from "lucide-react";
import { getGuestUsedCredits } from "@/lib/utils";
// 🚨 IMPORT DU BOUTON SIDEBAR
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
    const [mounted, setMounted] = useState(false);
    const [guestRemaining, setGuestRemaining] = useState(4);
    const [memberCredits, setMemberCredits] = useState(50);
    const { isLoaded, isSignedIn } = useAuth();

    useEffect(() => {
        setMounted(true);
        const used = getGuestUsedCredits();
        setGuestRemaining(Math.max(0, 4 - used));
    }, []);

    if (!mounted) return <header className="h-16 w-full border-b border-border/50 bg-background" />;

    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm">
            {/* J'ai supprimé la contrainte max-w-6xl pour que ça prenne toute la largeur proprement avec la sidebar */}
            <div className="flex h-16 items-center justify-between px-4 md:px-6 w-full">

                {/* 🚨 NOUVEAU CONTENEUR GAUCHE : Bouton Menu + Logo */}
                <div className="flex items-center gap-2 sm:gap-4">

                    {/* Le bouton d'ouverture du menu (visible surtout sur mobile, ou pour rouvrir la sidebar si fermée sur desktop) */}
                    <SidebarTrigger className="text-foreground/70 hover:text-foreground" />

                    {/* Logo Section */}
                    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-base sm:text-lg font-bold text-primary-foreground">F</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors hidden sm:block">
                            FIRIMA
                        </span>
                    </Link>
                </div>

                {/* Right Section (inchangé) */}
                <div className="flex items-center gap-4">
                    {!isLoaded ? (
                        <div className="flex items-center justify-center w-24">
                            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        </div>
                    ) : isSignedIn ? (
                        <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                            <Link href="/pricing" className="group flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full hover:bg-accent/20 transition-all">
                                <Zap className="w-4 h-4 text-accent group-hover:fill-accent transition-colors" />
                                <span className="text-sm font-semibold text-accent">
                                    {memberCredits}
                                </span>
                            </Link>
                            <UserButton />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <div className=" items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-full shadow-inner hidden md:flex">
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-foreground/70">
                                    {guestRemaining} essais libres
                                </span>
                            </div>

                            <SignInButton mode="modal">
                                <button className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors cursor-pointer hidden sm:block">
                                    Connexion
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium text-sm h-9 px-4 transition-all shadow-md cursor-pointer">
                                    S'inscrire
                                </button>
                            </SignUpButton>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}