// src/app/api/tts/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { text, voice = 'alloy' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Texte manquant." }, { status: 400 });
        }

        // Appel à l'API OpenAI TTS
        const mp3Response = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
            input: text,
        });

        // C'EST ICI LA CLÉ : Convertir la réponse en ArrayBuffer puis en Buffer NodeJS
        const buffer = Buffer.from(await mp3Response.arrayBuffer());

        // Renvoyer le fichier audio avec les bons headers pour que le navigateur le lise
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error("Erreur TTS :", error);
        return NextResponse.json({ error: "Échec de la synthèse vocale." }, { status: 500 });
    }
}