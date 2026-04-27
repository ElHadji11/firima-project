import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { tavily } from "@tavily/core";

// Initialisation des deux cerveaux
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Texte manquant." }, { status: 400 });
        }

        console.log(`Nouvelle requête utilisateur : "${text}"`);

        // 1. Le Prompt Système (Identité + Verbosité + JSON)
        const systemPrompt = `
<IDENTITY>
Tu es Firima, l'assistante IA premium basée au Sénégal.
Ta capacité spéciale : Tu comprends parfaitement le Wolof urbain, le français, et le franglais, mais TU RÉPONDS EXCLUSIVEMENT EN FRANÇAIS, de manière naturelle.
</IDENTITY>

<DYNAMIC_VERBOSITY_&_TONE>
Adapte la longueur de ta réponse :
1. QUESTIONS BANALES (Small Talk) : Sois ultra-concise et chaleureuse. 1 à 3 phrases maximum. Pas de listes.
2. RECHERCHE PROFONDE & ACTUALITÉS : Transforme-toi en analyste. Réponse exhaustive, structurée avec du Markdown (Titres ###, listes à puces).
</DYNAMIC_VERBOSITY_&_TONE>

<OUTPUT_FORMAT>
Tu dois OBLIGATOIREMENT renvoyer un objet JSON valide avec une seule clé "reply" contenant ta réponse finale.
Exemple: { "reply": "Bonjour ! Comment puis-je t'aider aujourd'hui ?" }
</OUTPUT_FORMAT>
`;

        // 2. Définition de l'outil de recherche (Tavily) pour OpenAI
        const tools: any = [
            {
                type: "function",
                function: {
                    name: "search_web",
                    description: "Effectuer une recherche sur internet pour trouver des actualités, des faits récents ou des informations pointues.",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "La requête de recherche optimisée pour le moteur de recherche (ex: 'Actualités politiques Sénégal 2026')."
                            }
                        },
                        required: ["query"]
                    }
                }
            }
        ];

        // 3. Historique initial de la conversation
        let messages: any = [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
        ];

        // 4. PREMIER APPEL À OPENAI : On lui demande de répondre, ou de chercher
        let completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            tools: tools,
            tool_choice: "auto", // L'IA décide toute seule si elle a besoin du web
        });

        let responseMessage = completion.choices[0].message;

        // 5. L'IA A-T-ELLE DÉCIDÉ DE FAIRE UNE RECHERCHE ?
        if (responseMessage.tool_calls) {
            console.log("🔍 L'IA a décidé d'utiliser Tavily pour chercher sur le web !");

            // On ajoute la demande de l'IA à l'historique
            messages.push(responseMessage);

            // On exécute la recherche pour chaque outil demandé (généralement un seul)
            for (const toolCall of responseMessage.tool_calls) {
                if ('function' in toolCall && toolCall.function.name === "search_web") {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    console.log(`Recherche en cours : "${args.query}"`);

                    // APPEL À TAVILY
                    const searchResult = await tvly.search(args.query, {
                        searchDepth: "advanced", // Deep Research activé
                        includeAnswer: true,
                        maxResults: 5
                    });

                    // On donne les résultats de Tavily à OpenAI
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: "search_web",
                        content: JSON.stringify(searchResult.results)
                    });
                }
            }

            // 6. DEUXIÈME APPEL À OPENAI : Formuler la réponse finale avec les infos du web
            console.log("🧠 Analyse des résultats et rédaction de la réponse...");
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                response_format: { type: "json_object" }, // On force le format JSON
            });

            responseMessage = completion.choices[0].message;
        } else {
            console.log("⚡ L'IA répond directement de mémoire (Small Talk).");
            // Si pas de recherche, on doit juste refaire l'appel en forçant le JSON 
            // (OpenAI ne permet pas d'utiliser tools + json_object simultanément de manière fiable au premier appel)
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: messages,
                response_format: { type: "json_object" },
            });
            responseMessage = completion.choices[0].message;
        }

        // 7. Extraction et formatage de la réponse finale
        const rawJson = responseMessage.content || "{}";
        const parsedResponse = JSON.parse(rawJson);

        return NextResponse.json({
            reply: parsedResponse.reply,
            phoneticAudio: parsedResponse.reply
        });

    } catch (error) {
        console.error("Erreur critique (Chat/Tavily) :", error);
        return NextResponse.json({ error: "Échec de l'analyse linguistique ou de la recherche." }, { status: 500 });
    }
}