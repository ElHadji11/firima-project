import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { clerkModalAppearance } from "@/lib/clerk-modal-appearance";
import { frFR } from '@clerk/localizations';
import type { Metadata, Viewport } from "next";

// Définit la couleur de la barre de statut du téléphone
export const viewport: Viewport = {
  themeColor: "#0f172a", // Mets ici la couleur sombre de ton background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom au double-clic (très important pour une sensation d'app native)
};

export const metadata: Metadata = {
  title: "Firima | Assistant IA",
  description: "L'assistante IA premium qui comprend le Wolof.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Firima",
  },
  formatDetection: {
    telephone: false,
  },
};

const roboto = Roboto({
  weight: ['600', '700', '900'],
  variable: "--font-roboto",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider appearance={clerkModalAppearance} localization={frFR}>
          {/* On englobe tout dans le Provider de shadcn */}
          <SidebarProvider>
            {/* La Sidebar qu'on vient de créer */}
            <AppSidebar />
            <SidebarInset className="flex flex-col w-full min-h-screen">
              {/* Si tu veux garder ton Header en haut, ajoute juste le SidebarTrigger dedans ou à côté */}
              <Header />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
