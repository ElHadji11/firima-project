import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseClient } from '@/lib/supabase';
import { openai as aiProvider } from '@ai-sdk/openai'; // Renommé pour éviter le conflit
import { generateText, type ModelMessage, tool } from 'ai';
import { z } from 'zod';
import OpenAI from 'openai'; // Import du client officiel pour la transcription

// Initialisation du client OpenAI pour Whisper
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
<IDENTITY>
Tu es Firima, l'assistante IA premium basée au Sénégal.
Ta capacité spéciale : Tu comprends parfaitement le Wolof urbain, le français, et le franglais, mais TU RÉPONDS EXCLUSIVEMENT EN FRANÇAIS.
NE DEMANDE JAMAIS "Veux-tu la signification ?". Agis comme un expert proactif.
RÈGLE ANTI-HALLUCINATION : Si tu ne connais pas la réponse, avoue-le. N'invente JAMAIS de faits.
</IDENTITY>

<RECHERCHE_INTERNET>
Si l'utilisateur pose une question sur l'actualité, les prix, ou l'immobilier (ex: studios à Dakar), TU DOIS utiliser l'outil 'search_internet' pour trouver les vraies annonces actuelles.
</RECHERCHE_INTERNET>

<OUTPUT_FORMAT>
CRITIQUE : TU DOIS TOUJOURS RÉPONDRE AVEC UN JSON VALIDE.
Même si le search_internet tool est utilisé, FORMATE TOUJOURS ta réponse finale en JSON.
Structure exacte exigée :
{
  "reply": "Ta réponse complète formattée en Markdown (inclus les détails de ta recherche, les prix et les quartiers ici)",
  "phonetic_string": "La phrase phonétique pour la synthèse vocale (sans les blocs markdown).",
  "detected_language": "french"
}
Ne retourne JAMAIS de texte brut. JAMAIS. Toujours du JSON valide.
</OUTPUT_FORMAT>
`.trim();

export async function POST(req: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("Clé API OpenAI manquante dans le fichier .env");
        }

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

        // ==========================================
        // 1. TRANSCRIPTION AUDIO (WHISPER-1)
        // ==========================================
        let transcribedText = "";
        const lastRawMessage = rawMessages[rawMessages.length - 1];

        if (lastRawMessage.role === 'user' && lastRawMessage.audioData) {
            try {
                console.log("🎤 Message vocal détecté. Début de la transcription...");

                // Convertir le base64 en Buffer
                const audioBuffer = Buffer.from(lastRawMessage.audioData, 'base64');

                // Préparer le fichier pour OpenAI
                const mimeType = lastRawMessage.audioMimeType || 'audio/webm';
                // OpenAI.toFile gère la conversion interne pour l'envoi multipart/form-data
                const file = await OpenAI.toFile(audioBuffer, 'audio.webm', { type: mimeType });

                // Appel à l'API Whisper
                const transcription = await openaiClient.audio.transcriptions.create({
                    file: file,
                    model: 'whisper-1',
                    // language: 'fr', // Optionnel : Décommente si tu veux forcer le français, mais laisse vide pour détecter le Wolof/Franglais
                });

                transcribedText = transcription.text;
                console.log("✅ Transcription réussie :", transcribedText);
            } catch (audioError) {
                console.error("❌ Erreur lors de la transcription :", audioError);
                transcribedText = "[Erreur de transcription audio]";
            }
        }

        // ==========================================
        // 2. FORMATAGE DES MESSAGES POUR GPT-4o
        // ==========================================
        const formattedMessages: ModelMessage[] = [];

        rawMessages.forEach((message, index) => {
            const isLast = index === rawMessages.length - 1;

            if (message.role === 'user') {
                let content = message.content || "";

                // Si c'est le dernier message et qu'on a une transcription, on remplace le contenu
                if (isLast && transcribedText) {
                    content = transcribedText;
                } else if (message.audioData && !isLast) {
                    // Pour les anciens messages vocaux dans l'historique
                    content = "Note vocale reçue.";
                }

                formattedMessages.push({ role: 'user', content });
            } else if (message.role === 'assistant') {
                formattedMessages.push({ role: 'assistant', content: message.content });
            }
        });

        // Le texte final qui sera sauvegardé en base de données
        const finalUserText = transcribedText || lastRawMessage.content || 'Message vocal';

        // ==========================================
        // 3. GESTION BASE DE DONNÉES (SUPABASE)
        // ==========================================
        if (supabase && userId && !chatId) {
            const title = finalUserText.substring(0, 40) || "Nouveau chat";
            const { data: newChat } = await supabase
                .from('chats')
                .insert([{ user_id: userId, title }])
                .select().single();
            if (newChat) chatId = newChat.id;
        }

        if (supabase && chatId) {
            await supabase.from('messages').insert([{
                chat_id: chatId,
                role: 'user',
                content: finalUserText
            }]);
        }

        // ==========================================
        // 4. APPEL À GPT-4o (AVEC LE TEXTE TRANSCRI)
        // ==========================================
        const result = await generateText({
            model: aiProvider('gpt-4o'), // Utilisation de l'alias
            system: SYSTEM_PROMPT,
            messages: formattedMessages,
            maxRetries: 5,
            temperature: 0,
            tools: {
                search_internet: tool({
                    description: "Chercher des informations récentes sur internet (actualité, politiques, annonces immobilières, etc.).",
                    inputSchema: z.object({
                        query: z.string().describe("La requête de recherche optimisée"),
                    }),
                    execute: async (args: { query: string }) => {
                        const query = args.query;
                        console.log(`🔍 GPT-4o cherche sur internet : ${query}`);
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
                                    days: 30
                                })
                            });
                            const data = await response.json();
                            if (!data.results || data.results.length === 0)
                                return "Aucune information pertinente trouvée.";
                            return data.results
                                .map((r: any) => `Titre: ${r.title}\nContenu: ${r.content}`)
                                .join('\n\n');
                        } catch (e) {
                            console.error("Erreur Tavily:", e);
                            return "Erreur lors de la recherche.";
                        }
                    },
                }),
            }
        });

        console.log(`🧠 L'IA a terminé en ${result.steps?.length || 1} étape(s).`);
        console.log(`📝 Texte brut COMPLET renvoyé par l'IA :`);
        console.log(result.text);

        // ==========================================
        // 5. PARSING JSON ET RETOUR
        // ==========================================
        let parsedData;
        try {
            const cleanJsonString = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedData = JSON.parse(cleanJsonString);
            console.log(`✅ JSON parsé avec succès`);
        } catch (e) {
            console.warn("⚠️ Fallback activé. Erreur parse :", e);
            parsedData = {
                reply: result.text,
                phonetic_string: result.text,
                detected_language: "mixed"
            };
        }

        const aiReply = parsedData.reply || "Désolé, je n'ai pas pu formuler la réponse.";

        if (supabase && chatId) {
            await supabase.from('messages').insert([{ chat_id: chatId, role: 'assistant', content: aiReply }]);
        }

        return NextResponse.json({
            reply: aiReply,
            phoneticAudio: parsedData.phonetic_string || aiReply,
            detectedLanguage: parsedData.detected_language || "mixed",
            chatId,
            // Optionnel : renvoyer la transcription au front-end pour l'afficher à l'utilisateur
            transcription: transcribedText
        });

    } catch (err: any) {
        console.error("Erreur API Chat:", err);
        return NextResponse.json({ error: "Erreur serveur : Impossible de générer la réponse." }, { status: 500 });
    }
}