import { useEffect, useState } from "react";
import { getOrders, createOrder, updateOrderStatus, deleteOrder, type Order } from "../api/client";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-800 text-yellow-200",
  ordered: "bg-blue-800 text-blue-200",
  shipped: "bg-purple-800 text-purple-200",
  delivered: "bg-green-800 text-green-200",
};

const STATUSES = ["pending", "ordered", "shipped", "delivered"];

export default function Orders() {
  const [tab, setTab] = useState<"cardmarket" | "libreproxies">("cardmarket");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newNotes, setNewNotes] = useState("");

  const load = () => {
    setLoading(true);
    getOrders(tab).then(setOrders).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleCreate = async () => {
    await createOrder({ source: tab, notes: newNotes });
    setNewNotes("");
    setShowNew(false);
    load();
  };

  const handleStatus = async (id: number, status: string) => {
    await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this order?")) return;
    await deleteOrder(id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <button onClick={() => setShowNew(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Order
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-700 mb-6">
        {(["cardmarket", "libreproxies"] as const).map((src) => (
          <button key={src} onClick={() => setTab(src)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${tab === src ? "border-indigo-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {src === "cardmarket" ? "Cardmarket" : "LibreProxies"}
          </button>
        ))}
      </div>

      {showNew && (
        <div className="bg-gray-800 rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
            <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600 focus:border-indigo-500 outline-none"
              placeholder={`New ${tab} order...`} />
          </div>
          <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm">Create</button>
          <button onClick={() => setShowNew(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No {tab} orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-700 text-gray-300"}`}>
                      {order.status}
                    </span>
                    <span className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="text-gray-400 text-xs">{order.total_items} items</span>
                    {order.total_cents > 0 && (
                      <span className="text-gray-300 text-xs">€{(order.total_cents / 100).toFixed(2)}</span>
                    )}
                  </div>
                  {order.notes && <p className="text-gray-300 text-sm">{order.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <select value={order.status} onChange={(e) => handleStatus(order.id, e.target.value)}
                    className="bg-gray-700 text-gray-200 text-xs rounded px-2 py-1 border border-gray-600 outline-none">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => handleDelete(order.id)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                </div>
              </div>

              {order.items.length > 0 && (
                <div className="border-t border-gray-700 pt-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-gray-500 w-4 text-right">{item.quantity}</span>
                      <span className="flex-1">{item.name}</span>
                      {item.price_cents > 0 && <span className="text-gray-400 text-xs">€{(item.price_cents / 100).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
