import { createClient } from '@supabase/supabase-js';

// Tu devras ajouter ces deux variables dans ton fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cette fonction crée un client Supabase "Authentifié" avec le token de Clerk
export const supabaseClient = async (clerkToken: string) => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    });

    return supabase;
};