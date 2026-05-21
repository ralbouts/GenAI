import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDeck, getDeckCards, getPrimer, savePrimer, updateDeck,
  type Deck, type DeckCard, type Primer,
} from "../api/client";
import BracketBadge from "../components/BracketBadge";
import ProxyBadge from "../components/ProxyBadge";
import CardImage from "../components/CardImage";

type Tab = "primer" | "decklist" | "stats";

const CATEGORIES = ["commander", "creature", "instant", "sorcery", "artifact", "enchantment", "planeswalker", "land", "other"];

export default function DeckDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const deckId = Number(id);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [primer, setPrimer] = useState<Primer | null>(null);
  const [tab, setTab] = useState<Tab>("primer");
  const [editingPrimer, setEditingPrimer] = useState(false);
  const [primerDraft, setPrimerDraft] = useState<Partial<Primer>>({});
  const [hoveredCard, setHoveredCard] = useState<DeckCard | null>(null);
  const [bracketEdit, setBracketEdit] = useState(false);

  useEffect(() => {
    getDeck(deckId).then(setDeck);
    getDeckCards(deckId).then(setCards);
    getPrimer(deckId).then(setPrimer);
  }, [deckId]);

  const savePrimerChanges = async () => {
    const saved = await savePrimer(deckId, primerDraft);
    setPrimer(saved);
    setEditingPrimer(false);
  };

  const groupedCards = CATEGORIES.reduce((acc, cat) => {
    const group = cards.filter((c) => c.category === cat);
    if (group.length) acc[cat] = group;
    return acc;
  }, {} as Record<string, DeckCard[]>);

  const colorCounts = cards.reduce((acc, c) => {
    c.colors.forEach((col) => { acc[col] = (acc[col] ?? 0) + c.quantity; });
    return acc;
  }, {} as Record<string, number>);

  const manaCurve = Array.from({ length: 8 }, (_, i) => ({
    cmc: i === 7 ? "7+" : String(i),
    count: cards.filter((c) => c.category !== "land" && c.category !== "commander" && (i === 7 ? c.cmc >= 7 : Math.round(c.cmc) === i)).reduce((s, c) => s + c.quantity, 0),
  }));
  const maxCurve = Math.max(...manaCurve.map((x) => x.count), 1);

  const COLOR_NAMES: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green", C: "Colorless" };
  const COLOR_BG: Record<string, string> = { W: "bg-yellow-100", U: "bg-blue-500", B: "bg-gray-800", R: "bg-red-500", G: "bg-green-600", C: "bg-gray-500" };

  if (!deck) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <button onClick={() => nav("/")} className="text-gray-400 hover:text-white text-sm mb-4 block">← Back to decks</button>
      <div className="flex gap-6 mb-6 items-start">
        {deck.commander?.image_uri && (
          <img src={deck.commander.image_uri} alt={deck.commander.name} className="w-32 rounded-xl shadow-lg hidden sm:block" />
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{deck.name}</h1>
          <p className="text-gray-400 mb-3">{deck.commander?.name}{deck.partner ? ` + ${deck.partner.name}` : ""}</p>
          <div className="flex gap-2 flex-wrap items-center">
            {bracketEdit ? (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((b) => (
                  <button key={b} onClick={async () => { await updateDeck(deckId, { bracket: b }); setDeck({ ...deck, bracket: b }); setBracketEdit(false); }}
                    className={`px-2 py-1 rounded text-sm font-bold ${deck.bracket === b ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                    [{b}]
                  </button>
                ))}
                <button onClick={() => setBracketEdit(false)} className="text-gray-400 text-xs px-2">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setBracketEdit(true)} title="Click to change bracket"><BracketBadge bracket={deck.bracket} /></button>
            )}
            {deck.has_proxies && <ProxyBadge />}
            <span className="text-gray-400 text-sm">{deck.card_count} cards</span>
            {deck.moxfield_url && <a href={deck.moxfield_url} target="_blank" rel="noreferrer" className="text-indigo-400 text-sm hover:underline">Moxfield ↗</a>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700 mb-6">
        {(["primer", "decklist", "stats"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Primer Tab */}
      {tab === "primer" && primer && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {editingPrimer ? (
              <div className="flex gap-2">
                <button onClick={savePrimerChanges} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm">Save</button>
                <button onClick={() => setEditingPrimer(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setEditingPrimer(true); setPrimerDraft({ ...primer }); }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded text-sm">Edit Primer</button>
            )}
          </div>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
            {editingPrimer ? (
              <textarea className="w-full bg-gray-800 text-gray-100 rounded-lg p-3 text-sm h-32 border border-gray-600 focus:border-indigo-500 outline-none"
                value={primerDraft.description ?? ""} onChange={(e) => setPrimerDraft({ ...primerDraft, description: e.target.value })} />
            ) : (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{primer.description || <span className="text-gray-500 italic">No description yet.</span>}</p>
            )}
          </section>

          {primer.strategies.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Strategies</h2>
              <div className="space-y-3">
                {primer.strategies.map((s, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-indigo-400 font-medium mb-1">{s.title}</h3>
                    <p className="text-gray-300 text-sm">{s.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {primer.cards_of_note.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Key Cards</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {primer.cards_of_note.map((cn, i) => {
                  const card = cards.find((c) => c.scryfall_id === cn.scryfall_id);
                  return (
                    <div key={i} className="bg-gray-800 rounded-lg overflow-hidden">
                      <CardImage uri={card?.image_uri ?? null} name={card?.name ?? cn.scryfall_id} className="w-full aspect-[5/7] object-cover" />
                      <p className="p-2 text-xs text-gray-300">{cn.note}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {primer.combos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Combos</h2>
              <div className="space-y-3">
                {primer.combos.map((combo, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">{combo.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {primer.tips.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Tips</h2>
              <ul className="space-y-2">
                {primer.tips.map((tip, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2"><span className="text-indigo-400">•</span>{tip}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Decklist Tab */}
      {tab === "decklist" && (
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            {CATEGORIES.filter((cat) => groupedCards[cat]).map((cat) => (
              <div key={cat}>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
                  {cat} ({groupedCards[cat].reduce((s, c) => s + c.quantity, 0)})
                </h3>
                <div className="space-y-1">
                  {groupedCards[cat].map((c) => (
                    <div key={c.deck_card_id}
                      onMouseEnter={() => setHoveredCard(c)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="flex items-center gap-2 text-sm text-gray-200 hover:text-white px-2 py-0.5 rounded hover:bg-gray-800 cursor-default">
                      <span className="text-gray-500 w-4 text-right">{c.quantity}</span>
                      <span className="flex-1">{c.name}</span>
                      {c.is_proxy && <ProxyBadge />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {hoveredCard && (
            <div className="w-48 shrink-0 sticky top-4 self-start">
              <CardImage uri={hoveredCard.image_uri} name={hoveredCard.name} className="w-full rounded-xl shadow-xl" />
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {tab === "stats" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Mana Curve</h2>
            <div className="flex items-end gap-2 h-32">
              {manaCurve.map((x) => (
                <div key={x.cmc} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-400">{x.count || ""}</span>
                  <div className="w-full bg-indigo-600 rounded-t transition-all" style={{ height: `${(x.count / maxCurve) * 100}%`, minHeight: x.count > 0 ? "4px" : "0" }} />
                  <span className="text-xs text-gray-400">{x.cmc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Color Identity</h2>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(colorCounts).map(([col, count]) => (
                <div key={col} className={`${COLOR_BG[col] ?? "bg-gray-600"} rounded-lg px-4 py-3 text-center min-w-16`}>
                  <div className="text-white font-bold text-lg">{count}</div>
                  <div className="text-white/80 text-xs">{COLOR_NAMES[col] ?? col}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Card Types</h2>
            <div className="space-y-2">
              {CATEGORIES.filter((c) => c !== "commander" && groupedCards[c]).map((cat) => {
                const count = groupedCards[cat].reduce((s, c) => s + c.quantity, 0);
                const total = cards.filter((c) => c.category !== "commander").reduce((s, c) => s + c.quantity, 0);
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm w-24 capitalize">{cat}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div className="bg-indigo-500 rounded-full h-2" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-gray-400 text-sm w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
