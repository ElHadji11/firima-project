import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const response = await fetch('https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY!,
                'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY!,
                'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN!
            },
            body: JSON.stringify({
                invoice: {
                    total_amount: 5000,
                    description: 'Abonnement Traduct\'Afriq Pro - 1 mois'
                },
                store: { name: 'Traduct Afriq' },
                // TRÈS IMPORTANT : On passe le userId Clerk pour le récupérer après le paiement
                custom_data: {
                    clerk_user_id: userId
                },
                actions: {
                    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
                    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
                    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paydunya`
                }
            })
        });

        const data = await response.json();

        if (data.response_code === "00") {
            return NextResponse.json({ url: data.response_text });
        } else {
            throw new Error(data.response_text);
        }

    } catch (error) {
        console.error("Erreur Checkout PayDunya:", error);
        return NextResponse.json({ error: "Échec de la création du paiement" }, { status: 500 });
    }
}