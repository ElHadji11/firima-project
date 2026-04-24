import React, { useState, useRef, useEffect } from 'react';
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { User, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { requiresAuthentication, incrementGuestCredits, resetGuestCredits } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabase';
import { Button } from './ui/button';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

// Définition de la structure d'un message
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isAudio?: boolean;
    imageUrls?: string[];
}

export default function ChatTab() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Nanga def ? Maa ngi fi ngir ma ley jappale. (Comment vas-tu ? Je suis là pour t\'aider.)'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const objectUrlsRef = useRef<string[]>([]);

    // Auto-scroll vers le dernier message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authReason, setAuthReason] = useState<'limit_reached' | 'file_upload' | null>(null);

    const { getToken, isSignedIn } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. On récupère le chatId depuis l'URL (s'il y en a un)
    const currentChatId = searchParams.get('chatId');

    // 2. EFFET MAGIQUE : Charger l'historique si on clique sur un ancien chat
    useEffect(() => {
        async function fetchOldMessages() {
            if (!currentChatId || !isSignedIn) {
                setMessages([]); // Nouveau chat = on vide l'écran
                return;
            }

            try {
                setIsLoading(true);
                const token = await getToken({ template: 'supabase' });
                const supabase = await supabaseClient(token as string);

                const { data, error } = await supabase
                    .from('messages')
                    .select('id, role, content')
                    .eq('chat_id', currentChatId)
                    .order('created_at', { ascending: true }); // Du plus vieux au plus récent

                if (error) throw error;

                if (data) {
                    setMessages(
                        data.map((msg) => ({
                            id: String(msg.id),
                            role: msg.role as Message['role'],
                            content: msg.content ?? '',
                        }))
                    );
                }
            } catch (error) {
                console.error("Erreur chargement messages:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOldMessages();
    }, [currentChatId, isSignedIn, getToken]);


    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrlsRef.current = [];
        };
    }, []);

    // Fonction appelée quand ton PromptInputBox envoie un message
    // Fonction appelée quand ton PromptInputBox envoie un message
    const handleSendMessage = async (messageText: string, files?: File[]) => {
        const hasFiles = files && files.length > 0;
        const authCheck = requiresAuthentication(!!hasFiles);

        if (authCheck.required && !isSignedIn) {
            setAuthReason(authCheck.reason);
            setShowAuthModal(true);
            return; // On bloque l'envoi du message !
        }

        if (!messageText.trim() && (!files || files.length === 0)) return;

        setIsLoading(true); // On lance le chargement tout de suite !

        let finalMessageText = messageText;
        const isAudioMessage = messageText.includes('[Voice message');

        // 🚨 1. INTERCEPTION AUDIO : On cherche le fichier audio
        const audioFile = files?.find(f => f.type.startsWith('audio/') || f.type.startsWith('video/'));

        if (isAudioMessage && audioFile) {
            try {
                // On envoie le fichier audio brut à ta route Whisper (/api/transcribe)
                const formData = new FormData();
                formData.append('file', audioFile);

                const transcribeRes = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                });

                if (!transcribeRes.ok) throw new Error("Échec de la transcription");

                const transcribeData = await transcribeRes.json();

                // MAGIE : On remplace le faux texte "[Voice message]" par ce que tu as VRAIMENT dit !
                finalMessageText = transcribeData.text;

            } catch (error) {
                console.error("Erreur STT:", error);
                setIsLoading(false);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: "Dama déggul bu baax. (Je n'ai pas bien entendu, peux-tu répéter ?)"
                }]);
                return; // On arrête l'envoi si la transcription échoue
            }
        }

        // Créer des URLs locales pour les images afin de les afficher immédiatement.
        const localImageUrls = files
            ? files
                .filter((file) => file.type.startsWith('image/'))
                .map((file) => {
                    const url = URL.createObjectURL(file);
                    objectUrlsRef.current.push(url);
                    return url;
                })
            : [];

        // 2. Créer le message utilisateur AVEC LE VRAI TEXTE TRANSSCRIT
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: finalMessageText, // <-- Le vrai texte est ici maintenant !
            isAudio: isAudioMessage,
            imageUrls: localImageUrls
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        // 3. Le véritable appel à l'API LLM (/api/chat)
        try {
            const formData = new FormData();
            formData.append(
                'messages',
                JSON.stringify(updatedMessages.map(m => ({ role: m.role, content: m.content })))
            );

            // On n'envoie QUE les images à GPT-4 (l'audio a déjà été géré par Whisper)
            if (files && files.length > 0) {
                const imageFiles = files.filter(f => f.type.startsWith('image/'));
                imageFiles.forEach((file) => formData.append('files', file));
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    chatId: currentChatId
                }),
            });

            if (!response.ok) throw new Error("Erreur serveur");

            const data = await response.json();

            if (data.chatId && !currentChatId) {
                // On met à jour l'URL de manière invisible pour le navigateur
                router.replace(`/?chatId=${data.chatId}`);
            }

            // Ajouter la réponse du bot à l'interface
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, botMessage]);

            // 🔊 OPTIONNEL MAIS MAGIQUE : Lancer l'audio automatiquement
            if (data.phoneticAudio) {
                playBotAudio(data.phoneticAudio);
            }

            if (!isSignedIn) {
                incrementGuestCredits();
            }

        } catch (error) {
            console.error("Erreur de chat:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Dama am problème technique. (J'ai un problème technique réseau)."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Petite fonction pour jouer l'audio de la réponse via Nova
    const playBotAudio = async (phoneticText: string) => {
        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: phoneticText, targetLang: 'wolof' })
            });
            if (res.ok) {
                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                new Audio(audioUrl).play();
            }
        } catch (e) {
            console.error("Erreur lecture audio auto:", e);
        }
    };

    const handleNewChat = () => {
        resetGuestCredits();
        setMessages([]); // Vide l'historique
        setShowAuthModal(false);
    };

    return (
        <>
            <div className="flex flex-col w-full h-[80vh] max-h-[800px] bg-card rounded-xl overflow-hidden border border-border shadow-2xl">

                {/* ZONE D'HISTORIQUE (Style WhatsApp) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-accent' : 'bg-primary'}`}>
                                    {msg.role === 'user' ? <User size={16} className="text-accent-foreground" /> : <Bot size={16} className="text-primary-foreground" />}
                                </div>

                                {/* Bulle de texte */}
                                <div
                                    className={`p-3 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-accent text-accent-foreground rounded-tr-none'
                                        : 'bg-muted text-muted-foreground border border-border rounded-tl-none'
                                        }`}
                                >
                                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.imageUrls.map((url, idx) => (
                                                <img
                                                    key={idx}
                                                    src={url}
                                                    alt="Pièce jointe"
                                                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-black/10"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {msg.isAudio ? (
                                        <div className="flex items-center gap-2 italic opacity-90">
                                            🎤 {msg.content}
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted border border-border rounded-2xl rounded-tl-none p-4 flex gap-1.5 items-center">
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ZONE DE SAISIE (Ton composant "Talkie-Walkie") */}
                <div className="p-4 bg-gradient-to-t from-card to-transparent">
                    <PromptInputBox
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        placeholder="Tapel fi... (Tape ton message...)"
                    />
                </div>
            </div>
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogTitle className="text-xl">
                        {authReason === 'file_upload'
                            ? "Analyse d'image détectée 📸"
                            : "Limite de session atteinte ⏱️"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {authReason === 'file_upload'
                            ? "Pour analyser des images avec notre IA Vision, veuillez créer un compte gratuit."
                            : "Vous avez atteint la limite de 3 messages pour cette conversation. Pour continuer ce fil et garder l'historique, connectez-vous ou passez Pro."}
                    </DialogDescription>

                    <div className="flex flex-col gap-3 mt-4">
                        <SignInButton mode="modal">
                            <Button className="w-full bg-primary text-primary-foreground">
                                Se connecter gratuitement
                            </Button>
                        </SignInButton>

                        {authReason === 'limit_reached' && (
                            <Button
                                variant="outline"
                                className="w-full border-border hover:bg-accent/10"
                                onClick={handleNewChat}
                            >
                                Ouvrir un nouveau chat vierge
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>

    );
}