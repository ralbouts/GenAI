import { useEffect, useState, useCallback } from "react";
import { getCollection, type CollectionEntry } from "../api/client";
import CardImage from "../components/CardImage";

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"];
const COLOR_MAP: Record<string, string> = { W: "⬜", U: "🔵", B: "⚫", R: "🔴", G: "🟢" };

export default function Collection() {
  const [items, setItems] = useState<CollectionEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<CollectionEntry | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getCollection(debouncedSearch || undefined).then(setItems).finally(() => setLoading(false));
  }, [debouncedSearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Collection</h1>
        <span className="text-gray-400 text-sm">{items.length} cards</span>
      </div>

      <input
        type="text"
        placeholder="Search cards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-600 focus:border-indigo-500 outline-none mb-6"
      />

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500 text-center py-16">No cards found.</div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-700">
                  <th className="pb-2 pr-4">Card</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Set</th>
                  <th className="pb-2 pr-4 text-center">Colors</th>
                  <th className="pb-2 pr-4 text-center">Qty</th>
                  <th className="pb-2 pr-4 text-center">Foil</th>
                  <th className="pb-2 pr-4 text-center">Cond.</th>
                  <th className="pb-2 text-center">In Decks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}
                    onMouseEnter={() => setHoveredCard(item)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-2 pr-4 font-medium text-gray-100">{item.name}</td>
                    <td className="py-2 pr-4 text-gray-400 text-xs">{item.type_line?.split("—")[0].trim()}</td>
                    <td className="py-2 pr-4 text-gray-400 uppercase text-xs">{item.set_code}</td>
                    <td className="py-2 pr-4 text-center">{item.colors.map((c) => COLOR_MAP[c] ?? c).join("")}</td>
                    <td className="py-2 pr-4 text-center text-gray-200">{item.quantity}</td>
                    <td className="py-2 pr-4 text-center">{item.foil ? "✨" : ""}</td>
                    <td className="py-2 pr-4 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${item.condition === "NM" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-300"}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-2 text-center text-gray-400 text-xs">{item.in_deck_ids.length || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hoveredCard && (
            <div className="w-44 shrink-0 sticky top-4 self-start">
              <CardImage uri={hoveredCard.image_uri} name={hoveredCard.name} className="w-full rounded-xl shadow-xl" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
