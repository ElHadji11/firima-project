import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        // PayDunya envoie les données en form-data ou JSON selon la configuration
        // Assurez-vous de parser correctement selon la doc IPN
        const body = await req.json();

        // 1. Sécurité : Vérification du Hash (Optionnel mais recommandé en production)
        // const hash = req.headers.get('PAYDUNYA-WEBHOOK-HASH');
        // Implémentez la vérification SHA-512 ici selon la doc PayDunya

        const status = body.data.status;
        const customData = body.data.custom_data;

        // 2. Si le paiement est réussi et qu'on a bien notre userId Clerk
        if (status === 'completed' && customData?.clerk_user_id) {
            const userId = customData.clerk_user_id;
            const client = await clerkClient();

            // 3. Mise à jour magique des métadonnées Clerk
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    plan: 'pro',
                    paid_at: new Date().toISOString()
                }
            });

            console.log(`[PayDunya Webhook] Utilisateur ${userId} passé en Pro avec succès.`);
        }

        // 4. Il faut toujours répondre 200 OK pour que PayDunya arrête d'envoyer la notification
        return new NextResponse("OK", { status: 200 });

    } catch (error) {
        console.error("Erreur Webhook PayDunya:", error);
        return new NextResponse("Webhook Handler Failed", { status: 500 });
    }
}