import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

        const translation = completion.choices[0].message.content;

        // Send the translation back to your Next.js frontend
        return NextResponse.json({ translation });

    } catch (error) {
        console.error("Translation Error:", error);
        return NextResponse.json({ error: "Failed to translate text" }, { status: 500 });
    }
}