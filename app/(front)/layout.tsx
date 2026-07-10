import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import LoyaltyGiftPopup from "./components/LoyaltyGiftPopup";
import MobileBottomBar from "./components/MobileBottomBar";
import WhatsAppFAB from "./components/WhatsAppFAB";
import QuickAddDrawer from "./components/QuickAddDrawer";
import AdminShortcut from "./components/AdminShortcut";
import { CartProvider } from "@/lib/cart";
import Script from "next/script";

export const metadata = {
  title: "DJI Store TN",
  description: "DJI Store TN — votre boutique tech et gadgets en ligne.",
};

export default function FrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Outfit:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap"
      />
      {/* v query param busts browser cache after each stylesheet update */}
      <link rel="stylesheet" href="/front/css/styles.css?v=42" />

      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileBottomBar />
      <WhatsAppFAB />
      <ChatBot />
      <QuickAddDrawer />
      <AdminShortcut />
      <LoyaltyGiftPopup />

      <Script src="/front/js/main.js?v=3" strategy="afterInteractive" />
    </CartProvider>
  );
}
