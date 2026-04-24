// src/app/api/tts/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
            model: "tts-1",
            voice: selectedVoice,
            input: text,
            speed: 0.85,
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

    } catch (error) {
        console.error("Erreur de Synthèse Vocale (TTS) :", error);
        return NextResponse.json({ error: "Échec de la génération audio." }, { status: 500 });
    }
}