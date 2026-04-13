import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { text, targetLang = 'french' } = await req.json();

        if (!text || typeof text !== 'string' || !text.trim()) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const systemPrompt = `
You are a professional document summarizer.
Your task is to create a concise summary in ${targetLang}.

Rules:
- Output ONLY the summary, no labels or explanations.
- Keep the summary brief but informative.
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            temperature: 0.3,
        });

        const summary = completion.choices[0].message.content?.trim() ?? '';

        return NextResponse.json({ summary });

    } catch (error) {
        console.error("Summarization Error:", error);
        return NextResponse.json({ error: "Failed to summarize text" }, { status: 500 });
    }
}