// src/components/TranslationTab.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2, ArrowRightLeft, Info, Loader2, StopCircle, Copy, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 🎨 Sélecteur de langue minimaliste (style DeepL)
function LanguageSelector({
    selected,
    onChange,
    options
}: {
    selected: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <Select value={selected} onValueChange={onChange}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] border-none bg-transparent hover:bg-accent/5 text-sm font-medium text-foreground/80 focus:ring-0 focus:ring-offset-0 transition-colors">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border shadow-lg">
                {options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function TranslationTab({ context }: { context: string }) {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [phoneticText, setPhoneticText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto'); // Langue source ajoutée
    const [targetLang, setTargetLang] = useState('wolof');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        // 1. On crée un timer
        const timer = setTimeout(() => {
            if (sourceText.trim().length > 0) {
                handleTranslateText();
            } else {
                // Si l'utilisateur a tout effacé, on efface aussi la traduction
                setTranslatedText('');
                setPhoneticText('');
            }
        }, 1000); // ⏱️ Attendre 1 seconde (1000ms) après la dernière frappe

        return () => clearTimeout(timer);
    }, [sourceText, targetLang]);

    const sourceLanguages = [
        { value: 'auto', label: '🔍 Détecter la langue' },
        { value: 'français', label: 'Français' },
        { value: 'wolof', label: 'Wolof' },
        { value: 'anglais', label: 'Anglais' },
    ];

    const targetLanguages = [
        { value: 'français', label: 'Français' },
        { value: 'wolof', label: 'Wolof' },
        { value: 'anglais', label: 'Anglais' },
    ];

    const handlePlayTTS = async () => {
        if (!translatedText) return;
        setIsSpeaking(true);
        setError('');

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: phoneticText,
                    targetLang: targetLang
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur réseau (${response.status})`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.play();

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

        } catch (err: any) {
            console.error("Erreur de lecture audio:", err);
            setError(`Échec audio : ${err.message}`);
            setIsSpeaking(false);
        }
    };

    const startRecording = async () => {
        setError('');
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                await handleTranscribeAudio(audioBlob);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);

        } catch (err) {
            console.error("Erreur d'accès au microphone :", err);
            setError("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscribeAudio = async (audioBlob: Blob) => {
        setLoading(true);
        setError('');
        setSourceText('');

        const formData = new FormData();
        formData.append('file', audioBlob, 'input.webm');

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.text) {
                setSourceText(data.text);
            } else if (data.error) {
                setError(`Erreur de transcription : ${data.error}`);
            }
        } catch (err) {
            console.error("Erreur lors de l'envoi de l'audio :", err);
            setError("Échec de la connexion à l'API de transcription.");
        } finally {
            setLoading(false);
        }
    };

    const handleTranslateText = async () => {
        setError('');
        setTranslatedText('');

        if (!sourceText.trim()) {
            setError('Veuillez entrer du texte à traduire.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sourceText,
                    targetLang: targetLang,
                })
            });

            const data = await response.json();

            if (data.translation) {
                setTranslatedText(data.translation);

                if (data.phoneticAudio) {
                    setPhoneticText(data.phoneticAudio);
                } else {
                    setPhoneticText(data.translation);
                }
            } else if (data.error) {
                setError(data.error);
                setTranslatedText(data.error);
            } else {
                setError('Une erreur inconnue est survenue.');
            }
        } catch (err) {
            console.error(err);
            setError('Impossible de se connecter au moteur de traduction.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!translatedText) return;
        await navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return; // Pas de swap si auto-détection
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-3">
            {/* ⚠️ Notification système */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/10 rounded-lg">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-foreground/70">
                    <strong>Langues supportées :</strong> Français, Wolof, Anglais en entrée/sortie.
                </p>
            </div>

            {/* 🎯 Conteneur principal - Style DeepL "Seamless Cards" */}
            <div className="relative bg-card border border-border rounded-2xl shadow-lg overflow-hidden">

                {/* Layout responsive : 2 colonnes desktop, stack mobile */}
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

                    {/* ═══════════════════════════════════════════════════
                        PANNEAU GAUCHE : SOURCE (Texte d'entrée)
                    ═══════════════════════════════════════════════════ */}
                    <div className="relative flex flex-col">

                        {/* En-tête : Sélecteur de langue source */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                            <LanguageSelector
                                selected={sourceLang}
                                onChange={setSourceLang}
                                options={sourceLanguages}
                            />
                        </div>

                        {/* Zone de texte source (Fusion avec la carte) */}
                        <div className="relative flex-1">
                            <Textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleTranslateText();
                                    }
                                }}
                                placeholder={`Entrez votre texte ici (${context.toLowerCase()})...`}
                                className="w-full h-full min-h-[280px] resize-none border-0 bg-transparent p-5 text-base text-foreground placeholder:text-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />

                            {/* Overlay de chargement */}
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm z-10">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Footer : Barre d'outils (Micro + Stats) */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-accent/5">
                            <div className="flex items-center gap-2">
                                {/* Bouton Micro avec animation pulse si enregistrement */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={loading}
                                    className={`h-9 w-9 rounded-lg transition-all ${isRecording
                                        ? 'bg-destructive/10 text-destructive animate-pulse hover:bg-destructive/20'
                                        : 'hover:bg-accent/80 text-foreground/60 hover:text-foreground'
                                        }`}
                                >
                                    {isRecording ? (
                                        <StopCircle className="w-5 h-5 transition-colors " />
                                    ) : loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-foreground/60" />
                                    ) : (
                                        <Mic className="h-5 w-5 transition-colors" />
                                    )}
                                </Button>

                                {/* Bouton Traduire (Ctrl+Entrée hint) */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleTranslateText}
                                    disabled={loading || !sourceText.trim()}
                                    className="h-9 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                            Traduction...
                                        </>
                                    ) : (
                                        'Traduire'
                                    )}
                                </Button>
                            </div>

                            {/* Compteur de caractères */}
                            <span className="text-xs text-foreground/40">
                                {sourceText.length} / 5000
                            </span>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════
                        PANNEAU DROIT : TRADUCTION (Texte de sortie)
                    ═══════════════════════════════════════════════════ */}
                    <div className="relative flex flex-col">

                        {/* En-tête : Sélecteur de langue cible */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                            <LanguageSelector
                                selected={targetLang}
                                onChange={setTargetLang}
                                options={targetLanguages}
                            />
                        </div>

                        {/* Zone de texte traduit (Fusion avec la carte) */}
                        <div className="relative flex-1">
                            <Textarea
                                value={translatedText}
                                readOnly
                                placeholder="La traduction apparaîtra ici..."
                                className={`w-full h-full min-h-[280px] resize-none border-0 bg-transparent p-5 text-base placeholder:text-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 ${error ? 'text-destructive' : 'text-foreground'
                                    }`}
                            />

                            {/* Overlay de chargement */}
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-sm z-10">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Footer : Barre d'outils (Volume + Copier) */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border/50 bg-accent/5">
                            <div className="flex items-center gap-2">
                                {/* Bouton Volume (TTS) */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePlayTTS}
                                    disabled={!translatedText || isSpeaking || loading}
                                    className={`h-9 w-9 rounded-lg transition-all ${isSpeaking
                                        ? 'bg-accent/20 text-accent animate-pulse'
                                        : 'hover:bg-accent/80 text-foreground/60 hover:text-foreground'
                                        }`}
                                >
                                    {isSpeaking ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Volume2 className="w-4 h-4" />
                                    )}
                                </Button>

                                {/* Bouton Copier */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopy}
                                    disabled={!translatedText}
                                    className="h-9 w-9 rounded-lg hover:bg-accent/80 text-foreground/60 hover:text-foreground transition-all"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Feedback visuel si erreur */}
                            {error && !loading && (
                                <span className="text-xs text-destructive">
                                    {error}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🔄 BOUTON D'INVERSION (Swap) - Position centrale absolue */}
                <div className="absolute top-[52px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                    <Button
                        size="icon"
                        onClick={handleSwapLanguages}
                        disabled={sourceLang === 'auto'}
                        className="h-10 w-10 rounded-full bg-card border-2 border-border shadow-md hover:shadow-lg hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ArrowRightLeft className="w-4 h-4 text-foreground/60" />
                    </Button>
                </div>
            </div>

            {/* 💡 Conseil raccourci clavier */}
            <p className="text-center text-xs text-foreground/40">
                💡 Astuce : Appuyez sur <kbd className="px-2 py-0.5 bg-accent/20 border border-border rounded text-foreground/60">Ctrl</kbd> + <kbd className="px-2 py-0.5 bg-accent/20 border border-border rounded text-foreground/60">Entrée</kbd> pour traduire rapidement
            </p>
        </div>
    );
}