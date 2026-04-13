// src/app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Buffer } from 'buffer';

// Initialisation du client OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        // Récupération des données FormData envoyées par le frontend
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "Aucun fichier audio reçu." }, { status: 400 });
        }

        // Convertir le fichier File en Buffer pour OpenAI
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Créer un objet File-like compatible avec l'API OpenAI
        // Note: OpenAI s'attend à un nom de fichier pour déterminer le format
        const audioFile = new File([buffer], 'input.webm', { type: file.type });

        console.log("Envoi du fichier audio à Whisper pour transcription...");

        // Appel à l'API OpenAI Whisper pour la transcription
        // On précise la langue d'entrée ('fr') pour améliorer la précision
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "fr", // Langue source : Français
        });

        console.log("Transcription réussie :", transcription.text);

        // Renvoi du texte transcrit au frontend
        return NextResponse.json({ text: transcription.text });

    } catch (error) {
        console.error("Erreur de transcription :", error);
        return NextResponse.json({ error: "Échec de la transcription audio." }, { status: 500 });
    }
}