// import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Désactive le PWA en dev pour éviter les bugs de cache quand tu codes
  register: true,
  // skipWaiting: true,
});

const nextConfig = {
  // Tes configurations Next.js existantes vont ici (images, etc.)
  reactStrictMode: true,
  turbopack: {},
};
// export default nextConfig;
export default withPWA(nextConfig);
