import { NextResponse } from 'next/server';
import OpenAI from 'openai'; // On importe la librairie OpenAI

// Initialisation du client (il ira chercher automatiquement OPENAI_API_KEY dans votre .env.local)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const { text, targetLang } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Texte manquant." }, { status: 400 });
        }

        console.log(`Génération TTS demandée pour : ${targetLang}`);

        // Pour le MVP, on utilise OpenAI TTS pour TOUTES les langues.
        let selectedVoice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova";

        // Appel à l'API OpenAI TTS
        const mp3Response = await openai.audio.speech.create({
            model: "tts-1", // tts-1 est optimisé pour le temps réel et la vitesse
            voice: selectedVoice, // On utilise la voix "nova" définie ci-dessus
            input: text,
            response_format: "mp3",
            speed: 0.95 // Vitesse ajustée pour bien articuler le Wolof
        });

        // Conversion en Buffer pour l'envoi au frontend
        const buffer = Buffer.from(await mp3Response.arrayBuffer());

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString()
            },
        });

    } catch (error: any) {
        console.error("Erreur de Synthèse Vocale (TTS) :", error);

        // Sécurité : si votre compte OpenAI n'a plus de crédit, on le signale proprement
        if (error?.status === 429) {
            return NextResponse.json({ error: "Quota OpenAI dépassé ou solde insuffisant." }, { status: 429 });
        }

        return NextResponse.json({ error: "Échec de la génération audio." }, { status: 500 });
    }
}