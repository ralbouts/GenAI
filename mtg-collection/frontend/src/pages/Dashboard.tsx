import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDecks, type Deck } from "../api/client";
import DeckBox from "../components/DeckBox";

export default function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    getDecks().then(setDecks).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Decks</h1>
        <button
          onClick={() => nav("/import")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Import Deck
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading decks...</div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No decks yet.</p>
          <button
            onClick={() => nav("/import")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Import your first deck from Moxfield
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {decks.map((d) => (
            <DeckBox key={d.id} deck={d} />
          ))}
        </div>
      )}
    </div>
  );
}
