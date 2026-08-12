import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DJI Store TN — Drones, caméras et équipement audiovisuel",
  description: "DJI Store TN — drones, caméras et équipement audiovisuel professionnel en Tunisie.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DJI Store TN",
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      {/* suppressHydrationWarning : extensions navigateur et Google Translate
          injectent des attributs (style, etc.) sur <body> avant l'hydratation */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/*
          Applique le thème sauvegardé avant le premier rendu — évite le flash.
          strategy="beforeInteractive" : Next.js hisse ce script dans le <head>
          du HTML généré, avant tout JS React. Le composant Script est lui-même
          dans <body> pour respecter les contraintes de React 19.
        */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
