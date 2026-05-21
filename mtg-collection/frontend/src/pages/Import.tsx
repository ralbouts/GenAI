import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { previewImport, doImport, type ImportPreview } from "../api/client";

export default function Import() {
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null);
    setLoading(true);
    try {
      const p = await previewImport(url);
      setPreview(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch deck");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await doImport(url);
      nav(`/decks/${result.deck_id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
      setImporting(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button onClick={() => nav("/")} className="text-gray-400 hover:text-white text-sm mb-6 block">← Back</button>
      <h1 className="text-2xl font-bold text-white mb-6">Import from Moxfield</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Moxfield Deck URL</label>
          <input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(null); }}
            placeholder="https://moxfield.com/decks/..."
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm border border-gray-600 focus:border-indigo-500 outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/30 rounded p-3">{error}</p>}

        {!preview ? (
          <button onClick={handlePreview} disabled={!url || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
            {loading ? "Fetching..." : "Preview Deck"}
          </button>
        ) : (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="text-white font-semibold text-lg">{preview.name}</h2>
            <div className="text-sm text-gray-300 space-y-1">
              <p><span className="text-gray-500">Format:</span> {preview.format}</p>
              <p><span className="text-gray-500">Commander(s):</span> {preview.commanders.join(", ")}</p>
              <p><span className="text-gray-500">Cards:</span> {preview.card_count}</p>
            </div>
            <p className="text-xs text-gray-500">Note: Importing will resolve all cards via Scryfall. This may take a minute.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleImport} disabled={importing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium">
                {importing ? "Importing..." : "Import Deck"}
              </button>
              <button onClick={() => { setPreview(null); setUrl(""); }} className="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
