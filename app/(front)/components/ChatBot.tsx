"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type SuggestedProduct = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  stock: number;
};

type Msg = { from: "bot" | "user"; text: string; products?: SuggestedProduct[] };

const GREETING =
  "Bonjour ! 👋 Je suis l'assistant DJI Store TN.\nDécrivez-moi votre projet (voyage, vlogging, podcast, mariage...) et je vous suggère les outils adaptés ! Je réponds aussi à vos questions : livraison, retours, garantie, paiement...";

const QUICK_QUESTIONS = [
  "Conseillez-moi un produit",
  "Je veux filmer mes voyages",
  "Délais de livraison ?",
  "Garantie ?",
];

// If the message describes a need/project → product recommendation API
const NEED_INDICATORS = [
  "je veux", "je cherche", "je voudrais", "j'aimerais", "jaimerais",
  "besoin", "conseil", "conseille", "recommand", "suggere", "suggestion",
  "quel produit", "quoi acheter", "que me", "pour filmer", "pour faire",
  "je fais", "je filme", "projet", "budget", "outil", "equipement",
  "vlog", "youtube", "tiktok", "podcast", "mariage", "voyage", "sport",
  "streaming", "debutant", "immobilier", "cinema", "documentaire",
];

// Rule-based knowledge base — keywords → answer
const KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["livraison", "livrer", "expedition", "delai", "delais", "shipping", "recevoir", "arrive"],
    answer:
      "🚚 Livraison :\n• Express 24-48h partout en Tunisie\n• Gratuite dès 50 DT d'achat\n• 7 DT en dessous de 50 DT\n\nVous recevrez un SMS de suivi dès l'expédition de votre commande.",
  },
  {
    keywords: ["retour", "retourner", "rembourse", "remboursement", "echanger", "echange", "annuler"],
    answer:
      "↩️ Retours :\n• Retours gratuits sous 30 jours\n• Le produit doit être dans son emballage d'origine\n• Remboursement sous 5-7 jours ouvrés\n\nPour lancer un retour, rendez-vous dans votre espace « Mon compte » → « Mes commandes ».",
  },
  {
    keywords: ["garantie", "garanti", "panne", "casse", "defectueux", "reparation", "sav"],
    answer:
      "🛡️ Garantie :\n• Tous nos produits sont garantis 2 ans\n• Produits 100% authentiques et certifiés\n• SAV réactif via la page Support\n\nEn cas de panne, contactez-nous avec votre numéro de commande.",
  },
  {
    keywords: ["paiement", "payer", "carte", "espece", "cash", "virement", "paypal", "securise"],
    answer:
      "💳 Paiement :\n• Carte bancaire (100% sécurisé)\n• Paiement à la livraison (cash)\n• Virement bancaire pour les pros\n\nToutes les transactions sont chiffrées et protégées.",
  },
  {
    keywords: ["prix", "cher", "promo", "promotion", "reduction", "solde", "remise", "offre"],
    answer:
      "🏷️ Prix & promos :\n• Consultez la page Boutique pour voir les promotions en cours\n• Les produits en promo affichent un badge « Promo »\n• Programme de fidélité : gagnez des points à chaque achat !",
  },
  {
    keywords: ["drone", "drones", "mavic", "avata"],
    answer:
      "🚁 Nos drones :\nNous proposons une gamme complète de drones professionnels — capture 4K, autonomie jusqu'à 45 min, portée 15 km.\n\n→ Découvrez-les dans la Boutique (catégorie Drones) !",
  },
  {
    keywords: ["camera", "cameras", "gimbal", "stabilisateur", "micro", "audio", "action"],
    answer:
      "📷 Caméras & accessoires :\nCaméras cinématiques, caméras d'action 4K, gimbals stabilisateurs et micros sans fil professionnels.\n\n→ Parcourez la Boutique pour voir tous les modèles disponibles !",
  },
  {
    keywords: ["stock", "disponible", "disponibilite", "rupture"],
    answer:
      "📦 Disponibilité :\nLe stock est affiché en temps réel sur chaque fiche produit (« En stock » avec la quantité).\n\nSi un produit est en rupture, revenez bientôt ou contactez-nous pour connaître la date de réapprovisionnement.",
  },
  {
    keywords: ["commande", "commander", "suivre", "suivi", "statut"],
    answer:
      "🛒 Commandes :\n• Suivez vos commandes dans « Mon compte » → « Mes commandes »\n• Un e-mail de confirmation est envoyé après chaque achat\n• Besoin d'aide sur une commande ? Contactez le support avec votre référence.",
  },
  {
    keywords: ["devis", "professionnel", "entreprise", "pro", "b2b", "revendeur", "quantite"],
    answer:
      "📄 Devis & pros :\nVous êtes une entreprise ou souhaitez commander en quantité ?\n\n→ Utilisez la page « Demander un devis » — réponse sous 24h ouvrées !",
  },
  {
    keywords: ["contact", "contacter", "telephone", "email", "mail", "adresse", "joindre", "humain", "conseiller"],
    answer:
      "📞 Nous contacter :\n• Page Contact du site\n• Support : page Support ou FAQ\n\nNotre équipe répond du lundi au samedi, 9h-18h.",
  },
  {
    keywords: ["compte", "inscription", "inscrire", "connexion", "connecter", "mot de passe", "password"],
    answer:
      "👤 Compte client :\n• Créez un compte via « Mon compte »\n• Mot de passe oublié ? Utilisez le lien de réinitialisation\n• Avec un compte : suivi des commandes, favoris et points fidélité !",
  },
  {
    keywords: ["fidelite", "points", "avantage", "cadeau"],
    answer:
      "⭐ Programme fidélité :\nGagnez des points à chaque achat (affichés sur les fiches produits).\nCumulez-les et profitez de réductions exclusives !\n\n→ Consultez votre solde dans « Mon compte » → « Fidélité ».",
  },
  {
    keywords: ["bonjour", "salut", "hello", "hi", "bonsoir", "hey", "cc", "coucou"],
    answer: "Bonjour ! 😊 Comment puis-je vous aider aujourd'hui ?",
  },
  {
    keywords: ["merci", "thanks", "super", "parfait", "top"],
    answer: "Avec plaisir ! 🙌 N'hésitez pas si vous avez d'autres questions. Bonne journée !",
  },
  {
    keywords: ["au revoir", "bye", "aurevoir", "a bientot"],
    answer: "Au revoir ! 👋 Merci de votre visite et à très bientôt sur DJI Store TN !",
  },
];

const FALLBACK =
  "Je n'ai pas bien compris votre question. 🤔\nEssayez de reformuler ou choisissez un sujet :\n• Livraison\n• Retours\n• Garantie\n• Paiement\n• Produits\n\nPour une aide personnalisée, rendez-vous sur la page Contact.";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function getAnswer(question: string): string {
  const q = normalize(question);
  let best: { answer: string; score: number } | null = null;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(normalize(kw))) score++;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { answer: entry.answer, score };
    }
  }
  return best?.answer ?? FALLBACK;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ from: "bot", text: GREETING }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || typing) return;

    setMessages((m) => [...m, { from: "user", text: question }]);
    setInput("");
    setTyping(true);

    const normalized = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const isNeed = NEED_INDICATORS.some((ind) => normalized.includes(ind));

    // --- Product recommendation flow ---
    if (isNeed) {
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { from: "bot", text: data.reply ?? FALLBACK, products: data.products ?? [] },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { from: "bot", text: "Oups, je n'arrive pas à chercher dans le catalogue. Réessayez dans un instant !" },
        ]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // --- FAQ flow (rule-based) ---
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: getAnswer(question) }]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  }

  return (
    <>
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Assistant DJI Store TN">
          <div className="chatbot-head">
            <div className="chatbot-head__avatar">🤖</div>
            <div className="chatbot-head__info">
              <strong>Assistant DJI Store TN</strong>
              <span>En ligne</span>
            </div>
            <button className="chatbot-head__close" onClick={() => setOpen(false)} aria-label="Fermer">
              ✕
            </button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "contents" }}>
                <div className={`chat-msg chat-msg--${m.from}`}>
                  {m.text}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="chat-products">
                    {m.products.map((p) => (
                      <Link key={p.id} href={`/produit/${p.id}`} className="chat-product">
                        <img
                          src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=70&auto=format&fit=crop"}
                          alt={p.title}
                        />
                        <span className="chat-product__info">
                          <span className="chat-product__title">{p.title}</span>
                          <span className="chat-product__price">{p.price} DT</span>
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="chat-typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className="chatbot-quick">
            {QUICK_QUESTIONS.map((q) => (
              <button key={q} onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          <form
            className="chatbot-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              placeholder="Écrivez votre message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Votre message"
            />
            <button type="submit" disabled={!input.trim() || typing} aria-label="Envoyer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
