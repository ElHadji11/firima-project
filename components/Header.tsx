"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import { Loader2, User, LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
    const [mounted, setMounted] = useState(false);
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <header className="h-16 w-full border-b border-border/30 bg-background/50" />;

    return (
        <header className="sticky top-0 z-50 w-full bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <div className="flex h-16 items-center justify-between px-4 md:px-6 w-full">

                {/* 🚨 GAUCHE : Bouton Menu + Logo Premium */}
                <div className="flex items-center gap-3 sm:gap-5">

                    <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors bg-transparent hover:bg-white/5" />

                    <Link href="/" className="flex items-center space-x-3 group outline-none">
                        {/* Icône "F" Glassmorphism */}
                        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 group-hover:border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)] group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-500 overflow-hidden">
                            {/* Éclat interne au survol */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent z-10">
                                F
                            </span>
                        </div>

                        {/* Texte FIRIMA avec Gradient au survol */}
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground/90 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-500 hidden sm:block">
                            FIRIMA
                        </span>
                    </Link>
                </div>

                {/* 🚨 DROITE : Authentification */}
                <div className="flex items-center gap-4">
                    {!isLoaded ? (
                        <div className="flex items-center justify-center w-24">
                            <Loader2 className="w-5 h-5 text-primary/50 animate-spin" />
                        </div>
                    ) : isSignedIn ? (
                        <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-500">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    {/* Avatar avec anneau lumineux au survol */}
                                    <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border/50 transition-all duration-300 hover:ring-2 hover:ring-primary/50 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] outline-none overflow-hidden">
                                        {user?.imageUrl ? (
                                            <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-semibold text-foreground">
                                                {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase()}
                                            </span>
                                        )}
                                    </button>
                                </DropdownMenuTrigger>

                                {/* Menu Déroulant Premium */}
                                <DropdownMenuContent align="end" className="w-64 rounded-2xl border-white/10 bg-card/80 backdrop-blur-xl p-2 shadow-2xl mt-2">
                                    <div className="mb-2 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 px-3 py-3 border border-white/5">
                                        <p className="text-sm font-semibold text-foreground">
                                            {user?.fullName || "Utilisateur"}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                                            {user?.primaryEmailAddress?.emailAddress}
                                        </p>
                                    </div>

                                    <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors focus:bg-white/5">
                                        <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                                        Gérer le compte
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/5 my-1" />

                                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5 text-sm font-medium text-destructive/80 transition-colors focus:bg-destructive/10 focus:text-destructive">
                                        <SignOutButton>
                                            <button className="w-full flex items-center">
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Déconnexion
                                            </button>
                                        </SignOutButton>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 sm:gap-3 animate-in fade-in zoom-in duration-500">
                            <SignInButton mode="modal">
                                <button className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-full hover:bg-white/5 transition-all cursor-pointer hidden sm:block">
                                    Connexion
                                </button>
                            </SignInButton>

                            <SignUpButton mode="modal">
                                <button className="relative group bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium text-sm h-9 px-5 transition-all duration-300 shadow-[0_0_0_0_rgba(var(--primary),0)] hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] cursor-pointer overflow-hidden">
                                    <span className="relative z-10">S'inscrire</span>
                                    {/* Petit effet de reflet qui passe sur le bouton */}
                                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                </button>
                            </SignUpButton>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}