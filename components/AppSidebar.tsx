"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { supabaseClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import {
    SquarePen, Search, FolderClosed, Terminal,
    MoreHorizontal, Sparkles, Languages, BotMessageSquare, MessageSquare,
    User, Pin, Trash2, Pencil, MessageSquareDashed
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
    SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

// --- PREMIUIM SKELETON LOADER ---
function ChatSkeleton() {
    return (
        <div className="flex flex-col gap-2 px-2 animate-in fade-in duration-500">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-4 rounded-xl w-full bg-accent/30 animate-pulse">
                    <div className="w-4 h-4 rounded-md bg-foreground/10 shrink-0" />
                    <div className="h-3.5 bg-foreground/10 rounded-full w-3/4" />
                </div>
            ))}
        </div>
    );
}

function ChatList({ chats, isSignedIn }: { chats: any[], isSignedIn: boolean }) {
    const searchParams = useSearchParams();
    const currentChatId = searchParams.get('chatId');

    // --- ELEGANT EMPTY STATE ---
    if (chats.length === 0 && isSignedIn) {
        return (
            <div className="mx-2 my-4 p-6 rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-center bg-accent/10">
                <div className="p-3 rounded-full bg-background shadow-sm border border-border/50 mb-1">
                    <MessageSquareDashed className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Aucun historique</p>
                <p className="text-[11px] text-muted-foreground/60">Tes conversations apparaîtront ici.</p>
            </div>
        );
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
                            className={`transition-all duration-300 ease-out flex items-center justify-start gap-3 px-3 py-5 rounded-xl text-sm w-full outline-none relative overflow-hidden ${isActive
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-[inset_4px_0_0_0_hsl(var(--primary))]"
                                : "text-foreground/70 hover:bg-accent/40 hover:text-foreground hover:pl-4 border border-transparent"
                                }`}
                        >
                            <Link href={`/?chatId=${chat.id}`} className="flex items-center gap-2.5 outline-none w-full pr-8">
                                <MessageSquare className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isActive ? "text-primary fill-primary/10" : "text-muted-foreground/50 group-hover:text-foreground/50"}`} />
                                <span className="truncate relative z-10">{chat.title}</span>
                            </Link>
                        </SidebarMenuButton>

                        {/* --- MAC-OS STYLE BLURRED DROPDOWN --- */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg backdrop-blur-md transition-all duration-200 outline-none ${isActive
                                    ? 'opacity-100 text-primary hover:bg-primary/20'
                                    : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-background/80 hover:text-foreground shadow-sm'
                                    }`}>
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl p-1.5 animate-in zoom-in-95 duration-200">
                                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg py-2 transition-colors focus:bg-accent/50">
                                    <Pin className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Épingler</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg py-2 transition-colors focus:bg-accent/50">
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">Renommer</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border/50" />
                                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-lg py-2 text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                    <span className="font-medium">Supprimer</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

export function AppSidebar() {
    const { getToken, userId, isSignedIn } = useAuth();
    const { user } = useUser();
    const [chats, setChats] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadChats() {
            if (!isSignedIn) {
                setIsLoading(false);
                return;
            }
            try {
                const token = await getToken({ template: 'supabase' });
                const supabase = await supabaseClient(token as string);
                const { data, error } = await supabase
                    .from('chats')
                    .select('id, title')
                    .order('created_at', { ascending: false });

                if (data) setChats(data);
            } catch (error) {
                console.error("Erreur chargement historique:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadChats();
    }, [isSignedIn, getToken]);

    return (
        <Sidebar className="border-r border-border/20 dark:bg-background/95 bg-[#FAFAFA]/95 supports-[backdrop-filter]:backdrop-blur-2xl">
            <SidebarHeader className="pt-6 px-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        {/* --- LIQUID "NEW CHAT" BUTTON --- */}
                        <SidebarMenuButton asChild className="group relative overflow-hidden flex items-center justify-center gap-2 text-primary-foreground transition-all duration-500 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_14px_0_rgba(var(--primary-rgb),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary-rgb),0.23)] hover:-translate-y-0.5 h-12 mb-2 border-none">
                            <Link href="/">
                                {/* "Shine" sweep effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                                <SquarePen className="w-4 h-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 relative z-10 text-white" />
                                <span className="font-semibold tracking-wide relative z-10 text-white">Nouveau chat</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 mt-4 custom-scrollbar">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-3 px-3 flex items-center gap-2">
                        Récents
                        <div className="h-px bg-border/50 flex-1 ml-2" />
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        {isLoading ? (
                            <ChatSkeleton />
                        ) : (
                            <ChatList chats={chats} isSignedIn={!!isSignedIn} />
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* --- GLASSMORPHISM FOOTER PROFILE --- */}
            <SidebarFooter className="p-4 mb-2 relative">
                {/* Decorative background glow behind the profile card */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-50 pointer-events-none rounded-t-3xl" />

                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="relative z-10 flex flex-col gap-3 w-full bg-card/40 backdrop-blur-md rounded-2xl p-3 border border-border/40 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 group/profile">
                            <div className="flex items-center gap-3">
                                {/* Animated Avatar Ring */}
                                <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-accent to-primary background-animate relative transition-transform duration-300 group-hover/profile:scale-105">
                                    <div className="bg-background rounded-full p-0.5 h-full w-full">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/50 text-primary overflow-hidden transition-colors hover:bg-primary/20 font-bold outline-none">
                                                    {user?.imageUrl ? (
                                                        <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                                    ) : (
                                                        user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() || <User size={18} />
                                                    )}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl p-1.5 shadow-2xl">
                                                <DropdownMenuItem className="cursor-pointer rounded-lg p-2.5 font-medium transition-colors focus:bg-accent">
                                                    Gérer le compte
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <span className="text-sm font-semibold text-foreground truncate">{user?.fullName || "Ton Profil"}</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/70">Plan Gratuit</span>
                                </div>
                            </div>

                            {/* Upgrade Button */}
                            <button className="relative overflow-hidden flex items-center justify-center gap-2 text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground px-3 py-2.5 rounded-xl transition-all duration-300 w-full group/btn">
                                <Sparkles className="w-4 h-4 transition-transform duration-500 group-hover/btn:rotate-12 group-hover/btn:scale-110" />
                                <span className="relative z-10">Passer en Premium</span>
                            </button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}