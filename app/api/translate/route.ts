import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Fonction utilitaire pour le Hack Phonétique Wolof -> TTS Occidental
function applyWolofPhoneticHack(text: string) {
    let phonetic = text.toLowerCase();

    // 1. Voyelles longues et spéciales
    phonetic = phonetic.replace(/aa/g, 'ah')
        .replace(/ee/g, 'ay')
        .replace(/oo/g, 'oh')
        .replace(/uu/g, 'oo')
        .replace(/ë/g, 'uh')
        .replace(/é/g, 'ay')
        .replace(/ó/g, 'oh');

    // 2. Consonnes complexes (Biais Anglais pour les voix Alloy/Echo d'OpenAI)
    phonetic = phonetic.replace(/ñ/g, 'ny')
        .replace(/x/g, 'kh')
        .replace(/c/g, 'ch')
        .replace(/q/g, 'k');

    // 3. Le génie de votre rapport : Résolution des Prénasalisées (ex: "dafa mbëgëel" -> "dafam-buhguhl")
    // Cette Regex attrape le mot précédent, l'espace, la nasale (m/n) et la plosive, puis les regroupe avec un tiret.
    phonetic = phonetic.replace(/(\w+)\s+(m|n)([b|d|j|g|q])/g, '$1$2-$3');

    // 4. Prénasalisées en début de phrase absolue (sans mot avant)
    phonetic = phonetic.replace(/\bmb/g, 'm-b')
        .replace(/\bnd/g, 'n-d')
        .replace(/\bnj/g, 'n-j')
        .replace(/\bng/g, 'n-g');

    return phonetic;
}

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        // Read the data sent from your frontend Tab 1 (NO context here now!)
        const { text, sourceLang, targetLang } = await req.json();

        // Simpler System Prompt: Trusting the model
        const systemPrompt = `
      You are an expert, professional translator fluent in French and Standard Senegalese Wolof. 
      Your task is to translate from ${sourceLang} to ${targetLang}.
      
      CRITICAL RULES:
      - Use standard Wolof orthography (e.g., use 'x' for the guttural h, 'ñ' for ny, 'ŋ' for ng).
      - Maintain a professional, accurate, and respectful tone.
      - Aim for vocabulary suitable for professional, formal contexts like administration, health, and finance, inferring the precise register from the user's input.
      - Ensure that domain-specific terms are translated accurately for local Senegalese understanding based on context cues in the text.
      - Do not add conversational filler. Output ONLY the translated text.
    `;

        // Call the OpenAI API (GPT-4o)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.3, // Still low for accuracy
        });

        // ... appel à openai.chat.completions.create ...

        const translation = completion.choices[0].message.content || "";
        let phoneticAudio = translation;

        // Si la langue cible est le Wolof, on applique la translittération pour l'audio
        if (targetLang.toLowerCase() === 'wolof') {
            phoneticAudio = applyWolofPhoneticHack(translation);
        }

        // On renvoie les DEUX versions au frontend React
        return NextResponse.json({
            translation: translation,          // Pour l'affichage UI (ex: "xarit bi")
            phoneticAudio: phoneticAudio       // Pour envoyer au TTS (ex: "kharit bi")
        });

    } catch (error) {
        console.error("Translation Error:", error);
        return NextResponse.json({ error: "Failed to translate text" }, { status: 500 });
    }
}