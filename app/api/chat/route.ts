import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server'; // Import de l'authentification côté serveur
import { supabaseClient } from '@/lib/supabase'; // Ton utilitaire créé précédemment

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        // 1. VÉRIFICATION DE L'IDENTITÉ (CLERK)
        const { userId, getToken } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. CRÉATION DU LIEN SÉCURISÉ AVEC SUPABASE
        const token = await getToken({ template: 'supabase' });
        const supabase = await supabaseClient(token as string);

        // 3. LECTURE DE LA REQUÊTE FRONTEND
        const body = await req.json();
        const messages = body.messages || [];
        let chatId = body.chatId || null; // Le frontend nous dira si on est dans un vieux chat

        const lastUserMessage = messages[messages.length - 1].content;

        // 4. GESTION DU CHAT DANS LA BASE DE DONNÉES
        if (!chatId) {
            // C'est une nouvelle conversation ! On crée un "Dossier" dans Supabase
            // On génère un titre basé sur les premiers mots de l'utilisateur (max 30 caractères)
            const title = lastUserMessage.substring(0, 30) + (lastUserMessage.length > 30 ? '...' : '');

            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert([{ user_id: userId, title: title }])
                .select()
                .single();

            if (chatError) throw new Error("Erreur création chat Supabase");
            chatId = newChat.id;
        }

        // 5. SAUVEGARDE DU MESSAGE DE L'UTILISATEUR
        await supabase.from('messages').insert([{
            chat_id: chatId,
            role: 'user',
            content: lastUserMessage
        }]);

        // 6. APPEL À OPENAI (Génération de la réponse)
        // (J'ai repris ton prompt système exact)
        const systemPrompt = `
<IDENTITY>
Tu es l'Assistant Virtuel de Traduct'Afriq. Tu es un expert bilingue chaleureux et professionnel. 
L'utilisateur va te parler (soit en Français, soit en Wolof). Tu dois lui répondre de manière utile en utilisant le "Dakar-Wolof" (le code urbain du Sénégal).
Si l'utilisateur envoie une image, analyse-la et réponds à sa question en Dakar-Wolof.
</IDENTITY>

<KNOWLEDGE_BASE_RULES>
1. VOCABULARY TIERS: Utilise le Tier 1 (Terre-à-terre : lekk, dem, jappale). N'utilise JAMAIS le Wolof profond (Tier 3).
2. FRENCH FALLBACK: Pour les termes techniques, modernes ou administratifs (ex: entreprise, dossier, ordinateur, application), GARDE LE MOT FRANÇAIS et applique la grammaire Wolof.
3. ASPECT SYNTAX: Utilise "Maa ngi" pour le présent continu, "Dafa" pour les états/explications.
4. TONE: Sois direct, utile, et naturel.
</KNOWLEDGE_BASE_RULES>

<VISION_PROTOCOL>
When analyzing an image, you must be EXTREMELY LITERAL AND FACTUAL.
1. NO POETRY OR METAPHORS: Do not invent feelings (e.g., "sama xol..."). Do not invent objects that are not there (e.g., "solay bu weex").
2. USE TIER 1 VOCABULARY: Describe the scene simply. For a farm or nature scene, use basic words like 'tool' (field/farm), 'jant' (sun), 'gàncax' / 'ñax' (plants/grass), 'xeer' (stone).
3. KEEP IT BRIEF: A simple, natural Dakarois reaction to the image (e.g., "Photo bi dafay wone tool bu rafet ak jant biy sow...").
</VISION_PROTOCOL>

<TTS_PHONETIC_GUIDE>
Tu dois générer une "phonetic_string" optimisée pour la voix TTS française Nova d'OpenAI.
- Pour les mots WOLOF : transforme 'x' en 'kh', 'c' en 'tch', 'j' en 'dj', 'ñ' en 'gn', 'ë' en 'eu' (ex: "xale" -> "khalé").
- Pour les mots FRANÇAIS dans la phrase : Laisse-les INTACTS (ex: "entreprise", "dossier").
</TTS_PHONETIC_GUIDE>

<OUTPUT_FORMAT>
Return ONLY a valid JSON object matching this schema:
{
  "reply": "<Ta réponse naturelle en Dakar-Wolof orthographiée correctement>",
  "phonetic_string": "<La version phonétique secrète pour le moteur TTS>"
}
</OUTPUT_FORMAT>
`;
        const apiMessages = [{ role: "system", content: systemPrompt }, ...messages];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: apiMessages,
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const rawJson = completion.choices[0].message.content || "{}";
        const parsedResponse = JSON.parse(rawJson);
        const aiReply = parsedResponse.reply;

        // 7. SAUVEGARDE DE LA RÉPONSE DE L'IA DANS SUPABASE
        await supabase.from('messages').insert([{
            chat_id: chatId,
            role: 'assistant',
            content: aiReply
        }]);

        // 8. ON RENVOIE LA RÉPONSE AU FRONTEND (AVEC LE CHAT ID !)
        return NextResponse.json({
            reply: aiReply,
            phoneticAudio: parsedResponse.phonetic_string || aiReply,
            chatId: chatId // Très important pour que le frontend mette à jour l'URL !
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}