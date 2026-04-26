import { dark } from "@clerk/themes";

/**
 * Dark theme for Clerk modals (sign-in, sign-up) that matches the app's color palette.
 * Uses Clerk's prebuilt `dark` theme as a base, then overrides variables to match
 * this app's `.dark` palette from `app/globals.css` with the same orange primary color.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/appearance-prop/themes
 * @see https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables
 */
export const clerkModalAppearance = {
    baseTheme: dark,
    variables: {
        colorPrimary: "oklch(0.6801 0.1583 276.9349)", // --primary
        colorBackground: "oklch(0.2077 0.0398 265.7549)", // --background
        colorText: "white",
        colorTextOnPrimaryBackground: "white",
        colorTextSecondary: "white",
        colorInputBackground: "oklch(0.2427 0.0381 259.9437)", // --muted
        colorInputText: "white",
        colorDanger: "oklch(0.6368 0.2078 25.3313)", // --destructive
        fontFamily: "var(--font-roboto), Roboto, sans-serif",
        borderRadius: "0.5rem",
    },
    elements: {
        card: {
            backgroundColor: "oklch(0.2795 0.0368 260.0310)", // --card
            borderColor: "oklch(0.4461 0.0263 256.8018)", // --border
            boxShadow: "0px 4px 8px -1px hsl(0 0% 0% / 0.25)",
        },
        userButtonPopoverCard: {
            backgroundColor: "oklch(0.2795 0.0368 260.0310)", // --card
            borderColor: "oklch(0.4461 0.0263 256.8018)", // --border
            color: "white"
        },
        userButtonPopoverActionButtonText: {
            color: "white",
        },
        userButtonPopoverActionButtonIcon: {
            color: "white",
        },
        userButtonPopoverFooter: {
            display: "none", // Optionnel : cache la mention "Secured by Clerk" si souhaité, sinon supprimer cette ligne
        },
        formButtonPrimary: {
            fontWeight: "bold",
            color: "white",
        },
        formFieldInput: {
            borderColor: "oklch(0.4461 0.0263 256.8018)", // --border
            color: "white",
        },
        headerTitle: {
            color: "white",
        },
        headerSubtitle: {
            color: "white",
        },
        socialButtonsBlockButton: {
            borderColor: "oklch(0.4461 0.0263 256.8018)", // --border
            color: "white",
        },
        socialButtonsBlockButtonText: {
            color: "white",
            fontWeight: "500",
        },
        footerActionText: {
            color: "white",
        },
        dividerText: {
            color: "white",
        },
        formFieldLabel: {
            color: "white",
        },
        identityPreviewText: {
            color: "white",
        },
        formResendCodeLink: {
            color: "white",
        },
        badge: {
            color: "white",
        },
    },
};