import Link from "next/link";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl">
                {/* Logo Section */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-lg font-bold text-primary-foreground">F</span>
                    </div>
                    <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        FIRIMA
                    </span>
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-medium text-foreground/60">Online</span>
                    </div>
                </div>
            </div>
        </header>
    );
}