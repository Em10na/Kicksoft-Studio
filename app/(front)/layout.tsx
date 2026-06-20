import Header from "./components/Header";
import Footer from "./components/Footer";
import Script from "next/script";

export const metadata = {
  title: "Kicksoft Studio",
  description: "Kicksoft Studio — votre boutique tech et gadgets en ligne.",
};

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
      />
      <link rel="stylesheet" href="/front/css/styles.css" />

      <Header />
      <main id="main">{children}</main>
      <Footer />

      <Script src="/front/js/main.js" strategy="afterInteractive" />
    </>
  );
}
