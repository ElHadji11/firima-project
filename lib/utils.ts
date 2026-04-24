import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// src/lib/utils.ts

// --- GESTION DES CRÉDITS INVITÉS (GUEST) ---
const GUEST_MAX_CREDITS = 3;
const GUEST_CREDIT_KEY = 'traductafriq_guest_credits';
const GUEST_SESSION_ID_KEY = 'traductafriq_guest_session';

// Générer un ID de session simple (pour le tracking basique)
function getOrCreateGuestSessionId() {
  if (typeof window === 'undefined') return null;
  let sessionId = localStorage.getItem(GUEST_SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(GUEST_SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Récupérer le nombre de crédits utilisés par l'invité
export function getGuestUsedCredits(): number {
  if (typeof window === 'undefined') return 0;
  const credits = localStorage.getItem(GUEST_CREDIT_KEY);
  return credits ? parseInt(credits, 10) : 0;
}

// Ajouter un crédit (après une traduction réussie)
export function incrementGuestCredits() {
  if (typeof window === 'undefined') return;
  const current = getGuestUsedCredits();
  localStorage.setItem(GUEST_CREDIT_KEY, (current + 1).toString());
}

// Réinitialiser les crédits (ex: quand l'utilisateur "ouvre un autre chat")
export function resetGuestCredits() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CREDIT_KEY);
}

// Vérifier si l'utilisateur DOIT se connecter
export function requiresAuthentication(filesAttached: boolean): {
  required: boolean,
  reason: 'limit_reached' | 'file_upload' | null
} {
  // Règle 1 : L'upload de fichier exige TOUJOURS une connexion
  if (filesAttached) {
    return { required: true, reason: 'file_upload' };
  }

  // Règle 2 : Plus de 3 crédits dans la session courante exige une connexion
  const usedCredits = getGuestUsedCredits();
  if (usedCredits >= GUEST_MAX_CREDITS) {
    return { required: true, reason: 'limit_reached' };
  }

  return { required: false, reason: null };
}
