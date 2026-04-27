"use client"
import React, { useState, useRef, useEffect } from 'react';
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { motion, AnimatePresence } from "framer-motion";
import { requiresAuthentication, incrementGuestCredits, resetGuestCredits } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabase';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import LoadingState from './LoadingState';
import PasserPro from './PasserPro';
import WelcomeUser from './WelcomeUser';
import {
    User, Bot, StopCircle, Play, Pause, Volume2,
    RefreshCcw, ThumbsUp, ThumbsDown, Share2,
    Copy, Check, Edit2, // <-- Nouveaux imports
    Zap,
    Square,
    X,
    Send
} from "lucide-react";

// Définition de la structure d'un message
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isAudio?: boolean;
    imageUrls?: string[];
    detectedLanguage?: string;
    audioData?: string;
    audioMimeType?: string;
    audioPreviewUrl?: string;
    audioDurationSec?: number;
    phoneticAudio?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result?.toString().split(',')[1];
            resolve(base64String || '');
        };
        reader.onerror = (error) => reject(error);
    });
};

export default function ChatTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);
    const [isUserVoiceMode, setIsUserVoiceMode] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const objectUrlsRef = useRef<string[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const currentAudioUrlRef = useRef<string | null>(null);

    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [audioProgressById, setAudioProgressById] = useState<Record<string, number>>({});
    const [audioDurationById, setAudioDurationById] = useState<Record<string, number>>({});
    const messageAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike' | null>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // États pour l'édition de message (Inline Edit)
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    // Auto-scroll vers le dernier message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const [authReason, setAuthReason] = useState<'limit_reached' | 'file_upload' | null>(null);

    const { getToken, isSignedIn } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // 1. On récupère le chatId depuis l'URL (s'il y en a un)
    const currentChatId = searchParams.get('chatId');

    // ... vos autres useRef existants ...
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletRef = useRef<AudioWorkletNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    // Pour stocker la réponse texte qui arrive en streaming
    const accumulatedTextRef = useRef<string>("");

    const [isLiveRecording, setIsLiveRecording] = useState(false);

    // 2. EFFET MAGIQUE : Charger l'historique si on clique sur un ancien chat
    useEffect(() => {
        async function fetchOldMessages() {
            pauseAllMessageAudios();
            setAudioProgressById({});
            setAudioDurationById({});

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
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current = null;
            }
            if (currentAudioUrlRef.current) {
                URL.revokeObjectURL(currentAudioUrlRef.current);
                currentAudioUrlRef.current = null;
            }
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            objectUrlsRef.current = [];
        };
    }, []);

    const formatDuration = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getAudioDuration = (file: File) =>
        new Promise<number>((resolve) => {
            const probeUrl = URL.createObjectURL(file);
            const probe = new Audio(probeUrl);

            probe.onloadedmetadata = () => {
                const duration = Number.isFinite(probe.duration) ? probe.duration : 0;
                URL.revokeObjectURL(probeUrl);
                resolve(duration);
            };

            probe.onerror = () => {
                URL.revokeObjectURL(probeUrl);
                resolve(0);
            };
        });

    const pauseAllMessageAudios = () => {
        Object.values(messageAudioRefs.current).forEach((audio) => {
            if (!audio) return;
            audio.pause();
        });
        setPlayingMessageId(null);
    };

    const toggleMessageAudio = (messageId: string) => {
        const target = messageAudioRefs.current[messageId];
        if (!target) return;

        if (playingMessageId === messageId && !target.paused) {
            target.pause();
            setPlayingMessageId(null);
            return;
        }

        Object.entries(messageAudioRefs.current).forEach(([id, audio]) => {
            if (!audio) return;
            if (id !== messageId) audio.pause();
        });

        target.play().then(() => setPlayingMessageId(messageId)).catch(() => {
            setPlayingMessageId(null);
        });
    };

    const playEarcon = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.warn("Earcon failed", e);
        }
    };

    // --- UTILITAIRES POUR LE WEBSOCKET AUDIO ---
    function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        let offset = 0;
        for (let i = 0; i < float32Array.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    function arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // 1. Copier le texte
    const handleCopy = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000); // Remet l'icône normale après 2s
        } catch (err) {
            console.error("Erreur de copie :", err);
        }
    };

    // 2. Partager (utilise l'API de partage native du téléphone/PC si dispo)
    const handleShare = async (text: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Réponse de Firima',
                    text: text,
                });
            } catch (err) {
                console.log("Partage annulé ou échoué", err);
            }
        } else {
            // Fallback si on est sur un vieux navigateur
            handleCopy('share-fallback', text);
            alert("Texte copié dans le presse-papier !");
        }
    };

    // 3. Like / Dislike (Bascule on/off)
    const handleFeedback = (id: string, type: 'like' | 'dislike') => {
        setFeedback(prev => ({
            ...prev,
            [id]: prev[id] === type ? null : type // Annule si on reclique
        }));
        // TODO plus tard : Sauvegarder ce feedback dans Supabase pour améliorer Firima
    };

    // 4. Réessayer (Regénérer la dernière réponse)
    const handleRetry = async () => {
        if (isLoading) return;

        const lastUserIndex = [...messages].map(m => m.role).lastIndexOf('user');
        if (lastUserIndex === -1) return;

        const historyToKeep = messages.slice(0, lastUserIndex + 1);
        const lastUserMessage = historyToKeep[historyToKeep.length - 1];

        // UI: retire juste la dernière réponse assistant, garde le dernier user pour éviter le clignotement
        setMessages(historyToKeep);

        // Renvoie sans dupliquer le user dans l'historique
        await handleSendMessage(lastUserMessage.content, undefined, historyToKeep.slice(0, -1));
    };

    // 5. Éditer un ancien message utilisateur
    const startEdit = (msg: Message) => {
        setEditingMsgId(msg.id);
        setEditValue(msg.content);
    };

    const saveEdit = async (msgId: string) => {
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return;

        // On coupe l'historique jusqu'à ce message édité (on "remonte le temps")
        const historyToKeep = messages.slice(0, msgIndex);
        setMessages(historyToKeep);
        setEditingMsgId(null);

        // On envoie le message modifié !
        await handleSendMessage(editValue);
    };

    // ==========================================
    const handleSendMessage = async (messageText: string, files?: File[], customHistory?: Message[]) => {
        if (isLoading) return; // Garde-fou anti-spam

        if (!isSignedIn) {
            const filesAttached = files !== undefined && files.length > 0;
            const authCheck = requiresAuthentication(filesAttached);
            if (authCheck.required) {
                setAuthReason(authCheck.reason);
                setIsUpgradeModalOpen(true);
                return;
            }
            incrementGuestCredits();
        }

        setIsLoading(true);
        let finalMessageText = messageText;
        const isAudioMessage = messageText.includes('[Voice message') || files?.some(f => f.type.startsWith('audio/'));
        const audioFile = files?.find(f => f.type.startsWith('audio/') || f.type.startsWith('video/'));

        let audioBase64: string | undefined;
        let audioMimeType: string | undefined;
        let audioPreviewUrl: string | undefined;
        let audioDurationSec: number | undefined;

        if (isAudioMessage && audioFile) {
            setIsUserVoiceMode(true);
            playEarcon();
            try {
                audioPreviewUrl = URL.createObjectURL(audioFile);
                objectUrlsRef.current.push(audioPreviewUrl);
                audioDurationSec = await getAudioDuration(audioFile);
                finalMessageText = "🎤 [Message vocal standard]";
                audioBase64 = await fileToBase64(audioFile);
                audioMimeType = audioFile.type || 'audio/webm';
            } catch (err) {
                console.error('Erreur lecture audio:', err);
                finalMessageText = '[Erreur de lecture du message vocal]';
            }
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: finalMessageText,
            isAudio: isAudioMessage,
            audioData: audioBase64,
            audioMimeType,
            audioPreviewUrl,
            audioDurationSec,
        };

        const currentHistory = customHistory || messages;
        const updatedMessages = [...currentHistory, userMessage];
        setMessages(updatedMessages);

        try {
            // Création du Payload allégé (audio uniquement sur le dernier message)
            const payload = {
                text: finalMessageText || "🎤 [Message vocal]",
                messages: updatedMessages.map((m, idx) => {
                    const isLast = idx === updatedMessages.length - 1;
                    const isLastUserAudio = isLast && m.role === 'user' && !!m.audioData;
                    return {
                        role: m.role,
                        content: m.content,
                        ...(isLastUserAudio ? { audioData: m.audioData, audioMimeType: m.audioMimeType } : {}),
                    };
                }),
                chatId: currentChatId,
            };

            const payloadString = JSON.stringify(payload);
            const payloadBytes = new TextEncoder().encode(payloadString).length;
            console.log(`[ChatTab] payload size: ${payloadBytes} bytes (~${(payloadBytes / 1024).toFixed(1)} KB)`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payloadString,
                // signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error || `Chat API HTTP ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.reply || "Je n'ai pas pu répondre.",
                phoneticAudio: data.phoneticAudio || data.reply,
            };

            setMessages(prev => [...prev, assistantMessage]);

        } catch (err: any) {
            const msg = err?.name === 'AbortError'
                ? "La requête a expiré (25s). Réessaie."
                : "Une erreur est survenue. Vérifie ta connexion et réessaie.";

            console.error("Erreur envoi message:", err);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: msg,
            }]);
        } finally {
            setIsLoading(false);
            setIsUserVoiceMode(false);
        }
    };

    // Petite fonction pour jouer l'audio de la réponse via Nova
    const playBotAudio = async (phoneticText: string) => {
        if (!phoneticText) return;

        try {
            // 1. Nettoyage de l'audio précédent
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
                currentAudioRef.current = null;
                setIsBotSpeaking(false);
            }
            if (currentAudioUrlRef.current) {
                URL.revokeObjectURL(currentAudioUrlRef.current);
                currentAudioUrlRef.current = null;
            }

            // 2. PRÉVENTION CRUCIALE : On coupe le texte à 4000 caractères max.
            // (L'API TTS d'OpenAI crashe si on dépasse 4096 caractères)
            const safeText = phoneticText.substring(0, 4000);

            // 3. Appel à l'API
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: safeText, targetLang: 'wolof' })
            });

            // 4. GESTION DES ERREURS (Au lieu de planter en silence)
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Erreur API TTS :", res.status, errorData);
                alert("Impossible de générer l'audio. Le texte est peut-être trop long ou votre quota OpenAI est dépassé.");
                return;
            }

            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            currentAudioUrlRef.current = audioUrl;
            currentAudioRef.current = audio;

            audio.onplay = () => setIsBotSpeaking(true);
            audio.onpause = () => setIsBotSpeaking(false);
            audio.onended = () => {
                setIsBotSpeaking(false);
                if (currentAudioUrlRef.current === audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    currentAudioUrlRef.current = null;
                }
                currentAudioRef.current = null;
            };

            await audio.play();

        } catch (e) {
            console.error("Erreur lecture audio auto:", e);
            setIsBotSpeaking(false);
            // Utile si les navigateurs bloquent l'autoplay (très fréquent sur iOS/Safari)
            alert("Erreur de lecture audio. Si vous êtes sur iPhone, vérifiez que le mode silencieux est désactivé.");
        }
    };

    const stopBotAudio = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
        }
        if (currentAudioUrlRef.current) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
        }
        setIsBotSpeaking(false);
    };

    const handleNewChat = () => {
        resetGuestCredits();
        setMessages([]);
        setIsUpgradeModalOpen(false);
    };

    return (
        <>
            <div className="flex flex-col w-full h-[90vh] max-h-[800px] rounded-xl overflow-hidden">

                {/* ZONE D'HISTORIQUE (Style WhatsApp) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                    {messages.length === 0 ? (
                        <WelcomeUser onOpenProModal={() => setIsUpgradeModalOpen(true)} />
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-1 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0 size-10 rounded-full flex items-center justify-center ">
                                        {msg.role !== 'user' && (
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 100 100"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="20"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-primary text-opacity-100"
                                            >
                                                <path d="M 25 85 L 25 50 L 60 50 L 25 50 L 25 15 L 70 15" />
                                            </svg>
                                        )}
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
                                            <div className="w-[280px] rounded-2xl border border-border/70 bg-card/70 p-3 backdrop-blur-sm">
                                                {msg.audioPreviewUrl ? (
                                                    <div className="space-y-2">
                                                        <audio
                                                            ref={(el) => {
                                                                messageAudioRefs.current[msg.id] = el;
                                                            }}
                                                            src={msg.audioPreviewUrl}
                                                            preload="metadata"
                                                            className="hidden"
                                                            onLoadedMetadata={(e) => {
                                                                const duration = e.currentTarget.duration || msg.audioDurationSec || 0;
                                                                setAudioDurationById((prev) => ({ ...prev, [msg.id]: duration }));
                                                            }}
                                                            onTimeUpdate={(e) => {
                                                                const currentTime = e.currentTarget.currentTime || 0;
                                                                setAudioProgressById((prev) => ({ ...prev, [msg.id]: currentTime }));
                                                            }}
                                                            onPlay={() => setPlayingMessageId(msg.id)}
                                                            onPause={() => {
                                                                setPlayingMessageId((current) => (current === msg.id ? null : current));
                                                            }}
                                                            onEnded={() => {
                                                                setPlayingMessageId(null);
                                                                setAudioProgressById((prev) => ({ ...prev, [msg.id]: 0 }));
                                                            }}
                                                        />

                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => toggleMessageAudio(msg.id)}
                                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/60 hover:bg-background/90 transition-colors"
                                                                aria-label={playingMessageId === msg.id ? "Pause audio" : "Play audio"}
                                                            >
                                                                {playingMessageId === msg.id ? (
                                                                    <Pause className="h-4 w-4" />
                                                                ) : (
                                                                    <Play className="h-4 w-4 ml-0.5" />
                                                                )}
                                                            </button>

                                                            <div className="flex-1">
                                                                <div className="h-1.5 w-full rounded-full bg-border/70 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary transition-[width] duration-100"
                                                                        style={{
                                                                            width: `${((audioProgressById[msg.id] || 0) / Math.max(audioDurationById[msg.id] || msg.audioDurationSec || 0.001, 0.001)) * 100}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between text-[11px] text-muted-foreground">
                                                            <span>Vocal</span>
                                                            <span>
                                                                {formatDuration(audioProgressById[msg.id] || 0)} / {formatDuration(audioDurationById[msg.id] || msg.audioDurationSec || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Aperçu audio indisponible</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">

                                                {editingMsgId === msg.id ? (
                                                    <div className="flex flex-col gap-2 w-full min-w-[200px]">
                                                        <textarea
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-full bg-background/50 border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                            rows={3}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingMsgId(null)} className="text-xs px-2 py-1 hover:text-muted-foreground transition-colors">
                                                                Annuler
                                                            </button>
                                                            <button onClick={() => saveEdit(msg.id)} className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors">
                                                                Envoyer
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2 group">
                                                        {msg.role === 'user' && !msg.isAudio && index >= messages.length - 2 && (
                                                            <button
                                                                onClick={() => startEdit(msg)}
                                                                className="p-1 text-muted-foreground hover:text-foreground transition-all"
                                                                title="Éditer le message"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                )}

                                                {msg.role === 'assistant' && (
                                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                                        <div className="flex flex-wrap items-center gap-1 mt-2">
                                                            {/* Écouter la réponse */}
                                                            <button
                                                                onClick={() => playBotAudio(msg.phoneticAudio || msg.content)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 text-foreground/70 hover:bg-background hover:text-primary transition-all shadow-sm border border-border/50 text-xs font-medium mr-1"
                                                                title="Écouter la réponse"
                                                            >
                                                                <Volume2 className="w-3.5 h-3.5" />
                                                                Écouter
                                                            </button>

                                                            {/* Copier */}
                                                            <button
                                                                onClick={() => handleCopy(msg.id, msg.content)}
                                                                className="p-1.5 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all"
                                                                title="Copier"
                                                            >
                                                                {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>

                                                            {/* Partager */}
                                                            <button
                                                                onClick={() => handleShare(msg.content)}
                                                                className="p-1.5 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground transition-all"
                                                                title="Partager"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Like */}
                                                            <button
                                                                onClick={() => handleFeedback(msg.id, 'like')}
                                                                className={`p-1.5 rounded-full transition-all ${feedback[msg.id] === 'like' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'}`}
                                                                title="Bonne réponse"
                                                            >
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Dislike */}
                                                            <button
                                                                onClick={() => handleFeedback(msg.id, 'dislike')}
                                                                className={`p-1.5 rounded-full transition-all ${feedback[msg.id] === 'dislike' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'}`}
                                                                title="Mauvaise réponse"
                                                            >
                                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                            </button>

                                                            {/* Retry (Uniquement sur le tout dernier message de la liste) */}
                                                            {index === messages.length - 1 && (
                                                                <button
                                                                    onClick={handleRetry}
                                                                    className="p-1.5 rounded-full text-muted-foreground hover:bg-background/80 hover:text-primary transition-all ml-auto"
                                                                    title="Générer une autre réponse"
                                                                >
                                                                    <RefreshCcw className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )))}

                    {isLoading && (
                        <LoadingState />
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ZONE DE SAISIE & VOICE MODE */}
                <div className="relative flex min-h-[120px] items-end justify-center bg-gradient-to-t from-card to-transparent p-4">
                    <AnimatePresence mode="wait">
                        {isUserVoiceMode ?
                            <motion.div
                                key="user-voice-mode"
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-2xl backdrop-blur-md relative"
                            >


                                {/* L'animation des ondes */}
                                <div className="flex gap-[3px] h-8 items-end">
                                    {Array.from({ length: 15 }).map((_, i) => (
                                        <motion.span
                                            key={i}
                                            className="w-1.5 rounded-full bg-primary"
                                            initial={{ height: 4 }}
                                            animate={{ height: [4, 16 + Math.random() * 12, 4] }}
                                            transition={{
                                                duration: 0.6 + Math.random() * 0.4,
                                                repeat: Infinity,
                                                delay: i * 0.05,
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* LES DEUX BOUTONS CÔTE À CÔTE */}
                                <div className="mt-4 flex w-full max-w-[280px] items-center justify-between gap-3">
                                    <button
                                        type="button" // <-- CRUCIAL ICI
                                        // onClick={cancelLiveRecording}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="text-sm font-medium">Arrêter</span>
                                    </button>

                                    <button
                                        type="button" // <-- CRUCIAL ICI
                                        // onClick={stopLiveRecording}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                                    >
                                        <span className="text-sm font-medium">Envoyer</span>
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                            : isBotSpeaking ? (
                                <motion.div
                                    key="speaking-indicator"
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-2xl backdrop-blur-md relative"
                                >
                                    <svg
                                        width="40"
                                        height="40"
                                        viewBox="0 0 100 100"
                                        fill="none"
                                        strokeWidth="14"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="overflow-visible"
                                    >
                                        <defs>
                                            <linearGradient id="firima-glow" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" />
                                                <stop offset="100%" stopColor="hsl(var(--accent))" />
                                            </linearGradient>
                                            <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur stdDeviation="6" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>
                                        <path
                                            d="M 25 85 L 25 50 L 60 50 L 25 50 L 25 15 L 70 15"
                                            className="stroke-muted"
                                        />
                                        <motion.path
                                            d="M 25 85 L 25 50 L 60 50 L 25 50 L 25 15 L 70 15"
                                            stroke="url(#firima-glow)"
                                            filter="url(#f-glow)"
                                            initial={{ pathLength: 0, opacity: 0.8 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{
                                                pathLength: {
                                                    duration: 1.5,
                                                    ease: "easeInOut",
                                                    repeat: Infinity,
                                                    repeatType: "reverse",
                                                    repeatDelay: 0.2,
                                                },
                                                opacity: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
                                            }}
                                        />
                                    </svg>

                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-sm font-medium uppercase tracking-widest text-foreground">Firima parle...</span>
                                        <span className="animate-pulse text-xs text-muted-foreground">Wolof natif</span>
                                    </div>

                                    <button
                                        onClick={stopBotAudio}
                                        className="absolute bottom-4 right-4 group flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1.5 transition-all hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                                    >
                                        <StopCircle className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-destructive" />
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-destructive hidden sm:inline">Interrompre</span>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="prompt-box"
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="w-full flex items-end gap-2"
                                >
                                    {/* L'ancienne boîte reste intacte et prend toute la place possible */}
                                    <div className="flex-1">
                                        <PromptInputBox
                                            onSend={handleSendMessage}
                                            isLoading={isLoading}
                                            placeholder="Tapel fi... (Tape ton message...)"
                                        />
                                    </div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence>
                </div>
            </div >
            <PasserPro
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                authReason={authReason}
                onNewChat={handleNewChat}
            />
        </>

    );
}