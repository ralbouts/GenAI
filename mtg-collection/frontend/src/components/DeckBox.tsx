import { useNavigate } from "react-router-dom";
import type { Deck } from "../api/client";
import BracketBadge from "./BracketBadge";
import ProxyBadge from "./ProxyBadge";

export default function DeckBox({ deck }: { deck: Deck }) {
  const nav = useNavigate();
  const image = deck.commander?.image_uri;

  return (
    <div
      onClick={() => nav(`/decks/${deck.id}`)}
      className="relative cursor-pointer rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200 aspect-[3/4] bg-gray-800"
    >
      {image ? (
        <img src={image} alt={deck.commander?.name} className="absolute inset-0 w-full h-full object-cover object-top" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          {deck.commander?.name ?? "No Commander"}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm leading-tight mb-1.5 drop-shadow">{deck.name}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <BracketBadge bracket={deck.bracket} />
          {deck.has_proxies && <ProxyBadge />}
          <span className="text-gray-300 text-xs">{deck.card_count} cards</span>
        </div>
      </div>
    </div>
  );
}
