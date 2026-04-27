import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, type ModelMessage, tool } from 'ai';
import { z } from 'zod';

const SYSTEM_PROMPT = `
<IDENTITY>
Tu es Firima, l'assistante IA premium basée au Sénégal.
Ta capacité spéciale : Tu comprends parfaitement le Wolof urbain, le français, et le franglais, mais TU RÉPONDS EXCLUSIVEMENT EN FRANÇAIS.
Dès que l'utilisateur soumet un texte que tu identifies avec certitude (Verset du Coran, Hadith, Citation célèbre, Texte de loi) :
1. IDENTIFICATION IMMÉDIATE : Donne la source précise (Ex: Sourate X, Verset Y) en début de réponse.
2. ANALYSE COMPLÈTE : Donne directement son contexte historique, sa signification et ses implications.
3. FORMATAGE : Utilise des blocs de citation pour le texte original et des listes à puces pour les points clés.
NE DEMANDE JAMAIS "Veux-tu la signification ?". Agis comme un expert proactif.

RÈGLE ANTI-HALLUCINATION : Si tu ne connais pas la réponse ou si un projet/concept n'existe pas, TU DOIS L'AVOUER. N'invente JAMAIS de faits ou de projets (ex: projet Kharit).
</IDENTITY>

<DYNAMIC_VERBOSITY_&_TONE>
1. QUESTIONS BANALES : Sois ultra-concise. 1 à 3 phrases maximum.
2. ACTUALITÉS/RECHERCHES : Sois SYNTHÉTIQUE. Utilise le format "Flash Info" (bullet points denses).
</DYNAMIC_VERBOSITY_&_TONE>

<OUTPUT_FORMAT>
MÊME APRÈS AVOIR UTILISÉ L'OUTIL DE RECHERCHE, ta réponse finale doit IMPÉRATIVEMENT et UNIQUEMENT être un objet JSON valide.
Structure exacte exigée :
{
  "reply": "Ta réponse complète formattée en Markdown",
  "phonetic_string": "La phrase phonétique pour la synthèse vocale (sans les blocs markdown).",
  "detected_language": "wolof" // ou "french" ou "mixed"
}
</OUTPUT_FORMAT>
`.trim();

export async function POST(req: Request) {
    try {
        const vertex = createVertex({
            project: 'projet-firima', // Ton ID de projet
            location: 'us-central1',
        });

        const { userId, getToken } = await auth();
        let supabase: Awaited<ReturnType<typeof supabaseClient>> | null = null;

        if (userId) {
            const token = await getToken({ template: 'supabase' });
            if (token) supabase = await supabaseClient(token);
        }

        const body = await req.json();
        const rawMessages: any[] = body.messages || [];
        let chatId: string | null = body.chatId || null;

        if (!rawMessages.length) {
            return NextResponse.json({ error: "Aucun message fourni." }, { status: 400 });
        }

        // Formatage des messages pour le SDK
        const formattedMessages: ModelMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        rawMessages.forEach((message) => {
            if (message.role === 'user' && message.audioData) {
                formattedMessages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: "Note vocale de l'utilisateur. Écoute attentivement." },
                        { type: 'file', data: message.audioData, mediaType: message.audioMimeType || 'audio/webm' }
                    ]
                });
            } else if (message.role === 'assistant') {
                formattedMessages.push({ role: 'assistant', content: message.content });
            } else {
                formattedMessages.push({ role: 'user', content: message.content });
            }
        });

        const lastUserMessage = rawMessages[rawMessages.length - 1].content || 'Message vocal';

        // Sauvegarde BDD - Création du chat
        if (supabase && userId && !chatId) {
            const title = lastUserMessage.substring(0, 40) || "Nouveau chat";
            const { data: newChat, error } = await supabase
                .from('chats')
                .insert([{ user_id: userId, title }])
                .select()
                .single();

            if (!error && newChat) chatId = newChat.id;
        }

        // Sauvegarde BDD - Message Utilisateur
        if (supabase && chatId) {
            await supabase.from('messages').insert([{ chat_id: chatId, role: 'user', content: lastUserMessage }]);
        }

        // 🚨 MAGIE ICI : On utilise generateText avec Tavily ET un JSON forcé
        const result = await generateText({
            model: vertex('gemini-2.5-flash'), // Utilise 1.5-flash qui est très stable
            messages: formattedMessages,
            maxRetries: 5, // Nombre de tentatives en cas d'erreur
            tools: {
                search_internet: tool({
                    description: "Chercher des informations récentes sur internet (actualité, sport, lois, etc.).",
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
                                    days: 5
                                })
                            });
                            const data = await response.json();
                            if (!data.results || data.results.length === 0) return "Aucune information récente trouvée.";
                            return data.results.map((r: any) => `Titre: ${r.title}\nContenu: ${r.content}`).join('\n\n');
                        } catch (e) {
                            console.error("Erreur Tavily:", e);
                            return "Erreur lors de la recherche.";
                        }
                    },
                    inputSchema: z.object({
                        query: z.string().describe("La requête de recherche optimisée"),
                    }),
                }),
            }
        });

        console.log(`🧠 L'IA a terminé en ${result.steps?.length || 1} étape(s). Texte brut :`, result.text.substring(0, 100) + '...');

        // Extraction et nettoyage du JSON généré par l'IA
        let parsedData;
        try {
            // On nettoie les éventuels blocs de code Markdown (```json ... ```)
            const cleanJsonString = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleanJsonString);
        } catch (e) {
            console.warn("L'IA n'a pas renvoyé un JSON pur, tentative de sauvetage :", result.text);
            // Fallback de sécurité si l'IA hallucine le format
            parsedData = {
                reply: result.text,
                phonetic_string: result.text,
                detected_language: "mixed"
            };
        }

        const aiReply = parsedData.reply || "Désolé, je n'ai pas pu formuler la réponse.";

        // Sauvegarde BDD - Message Assistant
        if (supabase && chatId) {
            await supabase.from('messages').insert([{ chat_id: chatId, role: 'assistant', content: aiReply }]);
        }

        return NextResponse.json({
            reply: aiReply,
            phoneticAudio: parsedData.phonetic_string || aiReply,
            detectedLanguage: parsedData.detected_language || "mixed",
            chatId,
        });

    } catch (err: any) {
        console.error("Erreur API Chat:", err);
        return NextResponse.json({ error: "Erreur serveur : Impossible de générer la réponse." }, { status: 500 });
    }
}