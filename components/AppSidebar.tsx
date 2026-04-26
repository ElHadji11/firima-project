"use client";

import * as React from "react";
import Link from "next/link";
import { SignOutButton, useAuth, UserButton, useUser } from "@clerk/nextjs";
import { supabaseClient } from "@/lib/supabase"; // Ton pont Supabase
import { useSearchParams } from "next/navigation";
import {
    SquarePen, Search, FolderClosed, Terminal,
    MoreHorizontal, Sparkles, Languages, BotMessageSquare, MessageSquare, Loader2,
    User, Pin, Trash2, Pencil
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ChatList({ chats, isSignedIn }: { chats: any[], isSignedIn: boolean }) {
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get('chatId');

    if (chats.length === 0 && isSignedIn) {
        return <div className="px-3 py-4 text-xs font-medium text-muted-foreground/60 text-center uppercase tracking-widest">Aucun historique</div>;
    }

    return (
        <SidebarMenu className="gap-1.5 flex flex-col px-2">
            {chats.map((chat) => {
                const isActive = chat.id === currentChatId;
                return (
                    <SidebarMenuItem key={chat.id} className="relative group">
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`transition-all duration-300 flex items-center justify-start gap-3 px-3 py-5 rounded-xl text-sm w-full outline-none ${isActive
                                ? "bg-primary/15 text-primary font-semibold shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                                : "text-foreground/70 hover:bg-accent/30 hover:text-foreground"
                                }`}
                        >
                            <Link href={`/?chatId=${chat.id}`} className="truncate flex items-center gap-2.5 outline-none w-full pr-8">
                                {/* <MessageSquare classNzzame={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground/70"}`} /> */}
                                <span className="truncate">{chat.title}</span>
                            </Link>
                        </SidebarMenuButton>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-background/80 transition-opacity outline-none ${isActive ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'}`}>
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border">
                                <DropdownMenuItem className="cursor-pointer gap-2 transition-colors">
                                    <Pin className="w-4 h-4" />
                                    <span>Épingler</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                    <span>Renommer</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Supprimer</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
    SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
    const { getToken, userId, isSignedIn } = useAuth();
    const { user } = useUser();

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
        <Sidebar className="border-r border-border/30 dark:bg-[#121212] bg-[#FAFAFA]">
            <SidebarHeader className="pt-6 px-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        {/* Nouveau Chat : redirige vers l'accueil SANS paramètre chatId */}
                        <SidebarMenuButton asChild className="group flex items-center justify-center gap-2 text-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 w-full rounded-xl border border-primary/20 bg-primary/5 shadow-sm h-11 mb-2">
                            <Link href="/">
                                <SquarePen className="w-4 h-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
                                <span className="font-semibold tracking-wide">Nouveau chat</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 mt-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2 px-2">
                        Récents
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <React.Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin w-4 h-4 text-muted-foreground" /></div>}>
                            <ChatList chats={chats} isSignedIn={!!isSignedIn} />
                        </React.Suspense>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ... (Garde ton Footer avec le bouton Upgrade) ... */}
            <SidebarFooter className="p-4 mb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex flex-col gap-3 w-full bg-card rounded-2xl p-3 border border-border/40 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-accent relative">
                                    <div className="bg-background rounded-full p-0.5">
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
                                                <DropdownMenuItem className="mt-1 cursor-pointer rounded-md p-2 text-foreground transition-colors focus:bg-accent/20 focus:text-accent-foreground">
                                                    Gérer le compte
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">Ton Profil</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Plan Gratuit</span>
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-3 py-2 rounded-xl transition-all duration-300 w-full group">
                                <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                                Passer en Premium
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}