// src/components/TranslationTab.tsx
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2, ArrowRightLeft, Zap, Info, Loader2, StopCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sélecteur de langue simplifié : Langue de sortie uniquement
function LanguageSelector({ selected, onChange }: { selected: string; onChange: (value: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                Langue de Sortie
            </label>
            <Select value={selected} onValueChange={onChange}>
                <SelectTrigger className="w-full h-11 bg-card/50 border-border/50 hover:border-primary/50 transition-colors focus:border-primary focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                    <SelectItem value="français">Français</SelectItem>
                    <SelectItem value="wolof">Wolof</SelectItem>
                    <SelectItem value="anglais">Anglais</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}



export default function TranslationTab({ context }: { context: string }) {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLang, setTargetLang] = useState('wolof'); // Langue cible par défaut
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        setError('');
        audioChunksRef.current = []; // Réinitialiser les chunks

        try {
            // Demander la permission d'accéder au microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Créer le MediaRecorder avec le stream
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            // Gérer les données audio disponibles
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Gérer l'arrêt de l'enregistrement
            mediaRecorder.onstop = async () => {
                // Créer un Blob unique à partir des chunks accumulés
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                // Arrêter toutes les pistes du stream pour libérer le micro
                stream.getTracks().forEach(track => track.stop());

                // Envoyer l'audio pour transcription
                await handleTranscribeAudio(audioBlob);
            };

            // Démarrer l'enregistrement (collecter les données par tranches de 1s)
            mediaRecorder.start(1000);
            setIsRecording(true);
            console.log("Enregistrement démarré...");

        } catch (err) {
            console.error("Erreur d'accès au microphone :", err);
            setError("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
        }
    };

    // --- Fonction pour arrêter l'enregistrement ---
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            console.log("Enregistrement arrêté.");
        }
    };

    // --- Fonction pour envoyer l'audio à l'API de transcription ---
    const handleTranscribeAudio = async (audioBlob: Blob) => {
        setLoading(true);
        setError('');
        setSourceText(''); // Effacer le texte source précédent

        const formData = new FormData();
        // Le nom du fichier 'input.webm' est important pour que OpenAI reconnaisse le format
        formData.append('file', audioBlob, 'input.webm');

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData, // Envoi des données FormData
            });

            const data = await response.json();

            if (data.text) {
                // Mettre à jour le texte source avec la transcription reçue
                setSourceText(data.text);
                console.log("Transcription reçue et affichée.");

                // Optionnel : Lancer automatiquement la traduction après la transcription
                // handleTranslateText(); 
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

    // --- Fonction principale de traduction (Texte-à-Texte) ---
    const handleTranslateText = async () => {
        setError('');
        setTranslatedText(''); // Effacer la traduction précédente

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
                    targetLang: targetLang, // Envoi de la langue de sortie sélectionnée
                })
            });

            const data = await response.json();

            if (data.translation) {
                setTranslatedText(data.translation);
            } else if (data.error) {
                setError(data.error);
                setTranslatedText(data.error); // Afficher l'erreur dans la zone de sortie
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

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 w-full">

                {/* --- Panneau Source : Entrée (Simplifié) --- */}
                <div className="flex-1 w-full group space-y-2 ">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/5 to-accent/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <Textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder={`Entrez ou parlez votre texte (${context.toLowerCase()})...`}
                            className="relative h-64 p-4 bg-card/50 border-border/50 text-foreground placeholder:text-foreground/30 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/30 hover:border-border/80 transition-all resize-none"
                        />

                        {/* --- Bouton Micro Interactif --- */}
                        <Button
                            variant="ghost"
                            size="icon"
                            // Changer la fonction et le style selon l'état d'enregistrement
                            className={`absolute bottom-4 right-4 rounded-full transition-all duration-200 ${isRecording
                                ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive animate-pulse'
                                : 'bg-primary/10 hover:bg-primary/20 text-primary'
                                }`}
                            onClick={isRecording ? stopRecording : startRecording} // Alterner start/stop
                            disabled={loading} // Désactiver pendant le chargement
                        >
                            {isRecording ? (
                                <StopCircle className="w-5 h-5" /> // Icône Stop si enregistrement
                            ) : (
                                <Mic className="w-5 h-5" /> // Icône Micro sinon
                            )}
                        </Button>
                    </div>
                    {/* Notification Utilisateur */}
                    <div className="flex items-center gap-2 p-3 bg-card/30 border border-border/30 rounded-xl">
                        <Info className="w-4 h-4 text-primary" />
                        <p className="text-xs text-foreground/50">Important : Seuls le Français, le Wolof et l'Anglais sont supportés en entrée.</p>
                    </div>
                </div>

                {/* --- Panneau Cible : Sortie (Le cœur du changement) --- */}
                <div className="space-y-6 flex-1 w-full">
                    <div className="space-y-3">
                        <LanguageSelector selected={targetLang} onChange={setTargetLang} />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-accent/5 to-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        <Textarea
                            value={translatedText}
                            readOnly
                            placeholder="La traduction s'affichera ici..."
                            // Gestion de la couleur si erreur
                            className={`relative h-64 p-4 bg-card/50 border-border/50 rounded-2xl resize-none transition-all ${error ? 'text-destructive border-destructive' : 'text-foreground'}`}
                        />

                        {/* Indicateur de chargement centré si loading */}
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl z-10">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}

                        {/* Bouton Volume (Inactif pour l'instant) */}
                        <Button
                            variant="ghost"
                            className="rounded-full h-10 w-10 bg-linear-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow hover:shadow-md transition-all flex items-center justify-center"
                            size="icon"
                            disabled // Désactivé jusqu'à l'implémentation du TTS
                        >
                            <Volume2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Boutons d'action centraux (Inverser - Inactif pour l'instant) */}
                <div className="shrink-0 flex flex-col justify-start items-center pt-10">
                    <Button
                        className="rounded-full h-12 w-12 bg-linear-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg transition-all flex items-center justify-center mx-auto"
                        size="icon"
                        disabled // Désactivé car la source est auto-détectée
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-xs text-foreground/40 text-center opacity-50">Inverser</div>
                </div>
            </div>

            {/* --- Footer d'action --- */}
            <div className="flex gap-3 justify-center pt-4 border-t border-border/30">
                <Button
                    className="rounded-xl px-8 h-11 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg transition-all flex items-center gap-2"
                    onClick={handleTranslateText}
                    disabled={loading} // Désactiver pendant le chargement
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Traduction en cours...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Traduire
                        </>
                    )}
                </Button>
            </div>
        </div >
    );
} 