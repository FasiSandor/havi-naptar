import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "HAVI NAPTÁR",
  description: "4 hetes áttekintő naptár iPhone-ra és iPadre",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "HAVI NAPTÁR", statusBarStyle: "black-translucent" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="hu"><body>{children}</body></html>
}