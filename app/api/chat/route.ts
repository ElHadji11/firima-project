import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
// Remplacement d'OpenAI par l'écosystème Vercel AI / Google
import { createVertex } from '@ai-sdk/google-vertex';
import { generateObject, type ModelMessage, tool } from 'ai';
import { z } from 'zod';

// On garde l'excellent prompt de Claude, mais on retire la section <OUTPUT_FORMAT> 
// car Zod s'occupera de forcer la structure mathématiquement.
const SYSTEM_PROMPT = `
<IDENTITY>
Tu es Firima, l'assistante IA premium basée au Sénégal.
Ta capacité spéciale : Tu comprends parfaitement le Wolof urbain, le français, et le franglais, mais **TU RÉPONDS EXCLUSIVEMENT EN FRANÇAIS**, de manière naturelle, comme une humaine qui choisit de parler français.
</IDENTITY>

<DYNAMIC_VERBOSITY_&_TONE>
Tu dois IMPÉRATIVEMENT adapter la longueur et la structure de ta réponse :

1. QUESTIONS BANALES & CONVERSATION (Small Talk) :
- Exemples : Salutations ("Naka suba si ?"), questions simples.
- Règle : Sois ultra-concise, chaleureuse et directe. 1 à 3 phrases maximum.

2. ACTUALITÉS ET RECHERCHES (Synthétique mais Détaillé) :
- Exemples : "Quelles sont les nouvelles ?", "Que fait Ousmane Sonko ?", recherches web.
- Règle d'or : Sois SYNTHÉTIQUE avec une FORTE DENSITÉ D'INFORMATION. Ne fais pas de longs discours ou d'introductions interminables. Va droit au but.
- Format exigé : Utilise le format "Flash Info" (bullet points). Donne les détails cruciaux, les chiffres ou les faits marquants sous forme de liste à puces (avec des tirets ou des étoiles) pour que ce soit très rapide à lire.
- Limite : Maximum 1 court paragraphe d'introduction, suivi de 3 ou 4 points clés très denses.
</DYNAMIC_VERBOSITY_&_TONE>

<TAVILY_SEARCH_ANTICIPATION>
Si des informations de contexte issues d'une recherche web (News, Articles) te sont fournies dans le prompt caché, synthétise-les de manière intelligente. Ne te contente pas de copier-coller : croise les sources, mets en évidence les points clés et ajoute une légère touche de contexte si nécessaire pour le marché sénégalais ou africain, tout en restant strictement objective.
</TAVILY_SEARCH_ANTICIPATION>
`.trim();

export async function POST(req: Request) {
    try {
        const vertex = createVertex({
            project: 'projet-firima', // Votre ID de projet
            location: 'us-central1',  // La région par défaut recommandée
        });

        const { userId, getToken } = await auth();
        let supabase: Awaited<ReturnType<typeof supabaseClient>> | null = null;

        if (userId) {
            const token = await getToken({ template: 'supabase' });
            if (token) {
                supabase = await supabaseClient(token);
            }
        }

        const body = await req.json();
        const rawMessages: {
            role: "user" | "assistant";
            content: string;
            audioData?: string;
            audioMimeType?: string;
        }[] = body.messages || [];
        let chatId: string | null = body.chatId || null;

        if (!rawMessages.length) {
            return NextResponse.json({ error: "Aucun message fourni." }, { status: 400 });
        }

        const formattedMessages: ModelMessage[] = rawMessages.map((message) => {
            if (message.role === 'user' && message.audioData) {
                return {
                    role: 'user',
                    content: [
                        {
                            type: 'text' as const,
                            text: "L'utilisateur a envoyé cette note vocale. Écoute-la attentivement pour formuler ta réponse.",
                        },
                        {
                            type: 'file' as const,
                            data: message.audioData,
                            mediaType: message.audioMimeType || 'audio/webm',
                        },
                    ],
                };
            }

            if (message.role === 'assistant') {
                return {
                    role: 'assistant',
                    content: message.content,
                };
            }

            return {
                role: 'user',
                content: message.content,
            };
        });

        const lastUserMessage = rawMessages[rawMessages.length - 1].content || 'Message vocal';

        // Créer un nouveau chat uniquement pour les utilisateurs authentifiés.
        if (supabase && userId && !chatId) {
            const title = lastUserMessage.substring(0, 40) || "Nouveau chat";
            const { data: newChat, error } = await supabase
                .from('chats')
                .insert([{ user_id: userId, title }])
                .select()
                .single();

            if (error || !newChat) {
                console.error("Erreur création chat:", error);
                return NextResponse.json({ error: "Impossible de créer le chat." }, { status: 500 });
            }
            chatId = newChat.id;
        }

        // Sauvegarder le message utilisateur uniquement si un chat persistant existe.
        if (supabase && chatId) {
            await supabase.from('messages').insert([{
                chat_id: chatId,
                role: 'user',
                content: lastUserMessage
            }]);
        }

        // Appel à Gemini via Vercel AI SDK (remplace l'appel OpenAI)
        const { object } = await generateObject({
            model: vertex('gemini-2.5-flash'), // Utilise désormais Vertex AI
            system: SYSTEM_PROMPT,
            messages: formattedMessages,

            // L'intégration de Tavily
            // @ts-ignore : L'interface generateObject peut ne pas typer explicitement tools selon la version du SDK
            tools: {
                search_internet: tool({
                    description: "Chercher des informations en temps réel sur internet (actualité, météo, sport, surtout au Sénégal).",
                    parameters: z.object({
                        query: z.string().describe("La requête de recherche optimisée (ex: Actualité politique Dakar aujourd'hui)"),
                    }),
                    // @ts-expect-error : Contournement du mismatch de type entre Zod/AI SDK pour la fonction execute
                    execute: async ({ query }: { query: string }) => {
                        console.log(`🔍 Firima cherche sur internet : ${query}`);

                        try {
                            const response = await fetch('https://api.tavily.com/search', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
                                },
                                body: JSON.stringify({
                                    query: query,
                                    search_depth: "basic",
                                    include_answer: true,
                                    days: 5 // Limite aux infos des 5 derniers jours pour la fraîcheur
                                })
                            });

                            const data = await response.json();

                            if (!data.results || data.results.length === 0) {
                                return "Aucune information récente trouvée sur le web pour cette recherche.";
                            }

                            // Retourne un résumé clair des articles trouvés à Gemini
                            return data.results.map((r: any) => `Titre: ${r.title}\nContenu: ${r.content}`).join('\n\n');
                        } catch (e) {
                            console.error("Erreur Tavily:", e);
                            return "Erreur lors de la recherche sur internet. Fais de ton mieux avec tes connaissances actuelles.";
                        }
                    },
                }),
            },

            // maxSteps est crucial : il permet à l'IA de faire la recherche PUIS de générer le JSON
            // @ts-ignore
            maxSteps: 2,

            // Le Schéma Zod remplace le prompt JSON de Claude. C'est strict et typé.
            schema: z.object({
                reply: z.string().describe("La réponse complète et naturelle à afficher à l'utilisateur (si tu as utilisé internet, mentionne-le subtilement)"),
                phonetic_string: z.string().describe("La phrase exacte réécrite phonétiquement pour un synthétiseur vocal français. Exemples: 'jerejef' devient 'dié-ré-dièf'. Ne mets que le wolof dans cette chaîne."),
                detected_language: z.enum(["wolof", "french", "mixed"]).describe("La langue détectée de l'utilisateur")
            }),
        });

        const aiReply = object.reply;

        // Sauvegarder la réponse IA uniquement si un chat persistant existe.
        if (supabase && chatId) {
            await supabase.from('messages').insert([{
                chat_id: chatId,
                role: 'assistant',
                content: aiReply
            }]);
        }

        // Retourner l'objet JSON (plus besoin de parser manuellement)
        return NextResponse.json({
            reply: object.reply,
            phoneticAudio: object.phonetic_string,
            detectedLanguage: object.detected_language,
            chatId,
        });

    } catch (err: any) {
        const isTimeout = err?.name === 'AbortError';
        const errorMessage = isTimeout
            ? "La requête a pris trop de temps (timeout). Réessaie."
            : (err?.message || "Une erreur est survenue. Vérifie ta connexion et réessaie.");

        console.error("Erreur envoi message:", err);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: errorMessage,
        }]);
    }
}