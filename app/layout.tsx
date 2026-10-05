import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "HAVI NAPTÁR",
  description: "4 hetes áttekintő naptár iPhone-ra és iPadre",
  manifest: "/manifest.json",
  themeColor: "#0B0F14",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  appleWebApp: { capable: true, title: "HAVI NAPTÁR", statusBarStyle: "black-translucent" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="hu"><body>{children}</body></html>
}