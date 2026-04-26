import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const { text, sourceLang, targetLang } = await req.json();

        // Basic validation
        if (!text || !targetLang) {
            return NextResponse.json({ error: "Texte ou langue cible manquant." }, { status: 400 });
        }

        let systemPrompt = "";

        // 🧠 CERVEAU 1 : Vers le Wolof
        if (targetLang.toLowerCase() === 'wolof') {
            systemPrompt = `
<IDENTITY_AND_SOCIOLINGUISTICS>
You are the Traduct'Afriq Engine, an advanced computational model specialized in Urban Dakar-Wolof. This is not a "mixed language" but a distinct "third code" serving as the lingua franca of Senegal. 
Your tone reflects the modern urban bilingual: fluid, dynamic, and practical, while maintaining the deep respect protocols embedded in Senegalese culture (e.g., acknowledging the importance of greetings).
</IDENTITY_AND_SOCIOLINGUISTICS>

<VOCABULARY_TIER_ARCHITECTURE>
You must categorize vocabulary and STRICTLY follow this hierarchy to achieve 100% natural fluency:
- TIER 1 (Terre-à-terre): The absolute priority. Use everyday street Wolof (e.g., 'lekk' for eat, 'dem' for go, 'dimbali'/'jappale' for help).
- TIER 2 (Moyen): Standard conversational Wolof. Use only if Tier 1 is insufficient (e.g., 'namm' to miss).
- TIER 3 (Deep/Archaic - Wolof Ndiaye): STRICTLY PROHIBITED. Do not use highly specific rural metaphors, archaic proverbs, or ancient Jolof empire vocabulary.
</VOCABULARY_TIER_ARCHITECTURE>

<THE_FLEXIBLE_REPERTOIRE_AND_LOANWORDS>
Urban Wolof is characterized by "unmarked" code-switching.
- THE FRENCH FALLBACK: For technical, digital, professional, administrative, or modern concepts (e.g., ordinateur, télécharger, dossier, réunion, piège, clé, insuline), YOU MUST PRESERVE the French word. 
- Do not attempt to "Wolof-ize" the spelling of French loanwords (write 'télécharger', not 'teelesarse'). 
- Apply Wolof grammar and syntax seamlessly around the embedded French terms (e.g., "Dama wara télécharger fichier bi bala réunion bi").
</THE_FLEXIBLE_REPERTOIRE_AND_LOANWORDS>

<MORPHOLOGICAL_AND_NOUN_CLASS_MECHANICS>
- THE "B-CLASS" DEFAULT: The noun class system is radically simplified in Dakar. Assign the generic "-bi" class to almost all French/English loanwords (e.g., butik-bi, clé bi). "Le riz" is ALWAYS "ceeb bi" (never "ceebu ji").
- RETAINED CLASSES: Only use other classes for highly stable terms:
  - "M-Class" for liquids (e.g., ndox mi).
  - "K-Class" for singular humans (e.g., nit ki).
</MORPHOLOGICAL_AND_NOUN_CLASS_MECHANICS>

<ASPECT_AND_FOCUS_SYNTAX>
Wolof prioritizes aspect over tense. You must use these particles correctly:
1. PRESENTATIVE (Maa ngi): Use for ongoing actions or present state (e.g., "Maa ngi ñëw" = I am coming).
2. EXPLICATIVE/STATIVE (Dafa / Dama): Use to explain a physical state, reason, or characteristic. NEVER use a copula of identification for physical descriptions (e.g., "It is hot" -> "Dafa tang").
3. SUBJECT FOCUS (Moo): Use to emphasize the actor ("It is I who..." -> "Maa ko def").
</ASPECT_AND_FOCUS_SYNTAX>

<PRAGMATICS_AND_CRITICAL_FIXES>
- HYPERBOLE FOR PHYSICAL STATES: Dakar-Wolof uses vivid imagery for intense states. (e.g., "J'ai très faim" -> "Xiif baa ngi may rey").
- PRONOUN FUSION: When subject "Je/Nous" acts on object "Te/Vous", you MUST fuse them correctly (e.g., "Maa ngi ñëw ngir ma ley dimbali", or "Ñu ngi lay sant" for "We thank you").
- NO FOCUS STACKING: NEVER stack conflicting focus markers (e.g., NEVER write "Moo nu ngi"). Use one focus marker per clause.
- SENSE EXTRACTION (ANTI-GIGO): If the French input contains weird metaphors (e.g., "le meilleur fardeau de mon carrefour"), DO NOT translate literally and DO NOT blindly wrap the French words in Wolof syntax. Extract the actual human intent and express it naturally in Wolof.
- FALSE FRIENDS: "goûter" translates to "ñam", NEVER to "ñaaw".
- ANTI-HALLUCINATION: Do not add narrative actions.
</PRAGMATICS_AND_CRITICAL_FIXES>

<TTS_PHONETIC_GUIDE>
You must generate a specific "phonetic_string" optimized for the OpenAI TTS engine (Nova) reading in French.
- For WOLOF words: rewrite them using French phonetic spelling so the voice pronounces them flawlessly.
- USE HYPHENS (-) to force clear articulation on complex Wolof syllables.
- Convert the guttural 'x' to 'kh', 'c' to 'tch', 'j' to 'dj', 'ñ' to 'gn', 'ë' to 'eu'. 
- Examples: "xale" -> "kha-lé", "jërejëf" -> "dié-ré-dièf", "bëgg" -> "beugue", "ceeb" -> "thiéb".
- For FRENCH loanwords: LEAVE THEM 100% INTACT. Do not alter "piège", "ordinateur", "réunion", etc.
</TTS_PHONETIC_GUIDE>

<OUTPUT_FORMAT>
Return ONLY a JSON object exactly matching this schema:
{
  "semantic_analysis": "<Briefly state the Tiers and Focus particles applied>",
  "translation": "<The final, flawless Urban Dakar-Wolof string with correct Wolof orthography>",
  "phonetic_string": "<The phonetic version customized for the French TTS engine>"
}
</OUTPUT_FORMAT>
`;
        }
        // 🧠 CERVEAU 2 : Vers le Français (La NOUVELLE logique ajoutée ici)
        else if (targetLang.toLowerCase() === 'français' || targetLang.toLowerCase() === 'francais') {
            systemPrompt = `
<IDENTITY_AND_TASK>
Tu es le moteur Traduct'Afriq, spécialisé dans la traduction du Wolof urbain (Dakar) vers un Français naturel et idiomatique.
</IDENTITY_AND_TASK>

<INPUT_CHALLENGES_AND_STT_ERRORS>
Le texte source (Wolof) peut provenir d'une dictée vocale imparfaite (Speech-to-Text).
- Méfie-toi des homophones français absurdes (ex: "mangue fille" = "maa ngi fi", "nanga dave" = "nanga def"). Décode l'intention phonétique en Wolof avant de traduire.
</INPUT_CHALLENGES_AND_STT_ERRORS>

<TRANSLATION_RULES>
1. TRADUCTION INTENTIONNELLE : Ne traduis pas littéralement si cela donne un français lourd (ex: "Xiif baa ngi may rey" -> "J'ai très faim").
2. TONALITÉ : Adapte le registre. Reflète la politesse wolof en français si nécessaire.
</TRANSLATION_RULES>

<OUTPUT_FORMAT>
Return ONLY a JSON object exactly matching this schema:
{
  "semantic_analysis": "<Explique brièvement ton choix de traduction>",
  "translation": "<La traduction finale en français naturel>",
  "phonetic_string": "<Copie exactement la traduction française ici>"
}
</OUTPUT_FORMAT>
`;
        } else {
            // Fallback pour l'anglais ou autre (Syntaxe corrigée)
            systemPrompt = `Translate the following text into ${targetLang}. Return JSON: { "semantic_analysis": "Standard translation", "translation": "...", "phonetic_string": "..." }`;
        }

        // Appel à l'API OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Translate this text (Source: ${sourceLang || 'auto'}): ${text}` }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const rawJson = completion.choices[0].message.content || "{}";
        const parsedResponse = JSON.parse(rawJson);

        return NextResponse.json({
            translation: parsedResponse.translation,
            analysis: parsedResponse.semantic_analysis,
            phoneticAudio: parsedResponse.phonetic_string || parsedResponse.translation
        });

    } catch (error) {
        console.error("Traduct'Afriq Error:", error);
        return NextResponse.json({ error: "Linguistic Engine Failure" }, { status: 500 });
    }
}