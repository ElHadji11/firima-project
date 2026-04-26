"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import { Loader2, User } from "lucide-react";
// 🚨 IMPORT DU BOUTON SIDEBAR
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30 font-bold outline-none ring-2 ring-transparent focus:ring-primary/50">
                                        {user?.imageUrl ? (
                                            <img src={user.imageUrl} alt="Profile" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || <User size={18} />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border bg-card p-1 shadow-2xl">
                                    <div className="mb-1 rounded-lg bg-muted/30 px-2 py-2.5">
                                        <p className="text-sm font-medium text-foreground">
                                            {user?.fullName || "Utilisateur"}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user?.primaryEmailAddress?.emailAddress}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem className="mt-1 cursor-pointer rounded-md p-2 text-foreground transition-colors focus:bg-accent/20 focus:text-accent-foreground">
                                        Gérer le compte
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    <DropdownMenuItem asChild className="cursor-pointer rounded-md p-2 text-destructive transition-colors focus:bg-destructive/10 focus:text-destructive">
                                        <SignOutButton>
                                            <button className="w-full text-left">Déconnexion</button>
                                        </SignOutButton>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
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