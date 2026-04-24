"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { supabaseClient } from "@/lib/supabase"; // Ton pont Supabase
import {
    SquarePen, Search, FolderClosed, Terminal,
    MoreHorizontal, Sparkles, Languages, BotMessageSquare
} from "lucide-react";

import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
    SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
    const { getToken, userId, isSignedIn } = useAuth();

    // 1. L'état pour stocker les vrais chats de la DB
    const [chats, setChats] = React.useState<any[]>([]);

    // 2. Récupération des chats au chargement de la Sidebar
    React.useEffect(() => {
        async function loadChats() {
            if (!isSignedIn) return;

            try {
                const token = await getToken({ template: 'supabase' });
                const supabase = await supabaseClient(token as string);

                // On va chercher les chats de l'utilisateur, du plus récent au plus ancien
                const { data, error } = await supabase
                    .from('chats')
                    .select('id, title')
                    .order('created_at', { ascending: false });

                if (data) setChats(data);
            } catch (error) {
                console.error("Erreur chargement historique:", error);
            }
        }

        loadChats();
    }, [isSignedIn, getToken]);

    return (
        <Sidebar className="border-r-0 dark:bg-[#171717] bg-gray-50">
            <SidebarHeader className="pt-4 px-3">
                {/* ... (Garde tes liens vers le Traducteur et le Nouveau Chat ici) ... */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        {/* Nouveau Chat : redirige vers l'accueil SANS paramètre chatId */}
                        <SidebarMenuButton asChild className="text-foreground hover:bg-accent/50 transition-colors">
                            <Link href="/">
                                <SquarePen className="w-4 h-4 mr-2" />
                                <span>Nouveau chat</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 mt-6">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2 px-2">
                        Récents
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>

                            {/* 3. AFFICHAGE DYNAMIQUE DES CHATS SUPABASE */}
                            {chats.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton asChild className="text-sm text-foreground/90 hover:bg-accent/50 truncate w-full">
                                        {/* On crée le lien avec le paramètre d'URL */}
                                        <Link href={`/?chatId=${chat.id}`}>
                                            {chat.title}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                            {chats.length === 0 && isSignedIn && (
                                <div className="px-2 text-xs text-muted-foreground">Aucune conversation</div>
                            )}

                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ... (Garde ton Footer avec le bouton Upgrade) ... */}
            <SidebarFooter className="p-4 mb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between w-full bg-accent/10 rounded-xl p-2 border border-border/30">
                            <div className="flex items-center gap-3">
                                {/* On réutilise Clerk pour l'avatar */}
                                <UserButton />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Ton Profil</span>
                                    <span className="text-xs text-foreground/50">Gratuit</span>
                                </div>
                            </div>

                            {/* Bouton Upgrade Premium */}
                            <button className="flex items-center gap-1 text-xs font-medium bg-background border border-border hover:bg-accent px-2 py-1.5 rounded-lg transition-colors">
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                Mettre à niveau
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}