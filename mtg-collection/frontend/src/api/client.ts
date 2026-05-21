const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// Decks
export const getDecks = () => request<Deck[]>("/decks/");
export const getDeck = (id: number) => request<Deck>(`/decks/${id}`);
export const getDeckCards = (id: number) => request<DeckCard[]>(`/decks/${id}/cards`);
export const createDeck = (body: Partial<Deck>) => request<Deck>("/decks/", { method: "POST", body: JSON.stringify(body) });
export const updateDeck = (id: number, body: Partial<Deck>) => request<Deck>(`/decks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteDeck = (id: number) => request(`/decks/${id}`, { method: "DELETE" });
export const updateDeckCard = (deckId: number, dcId: number, body: object) =>
  request(`/decks/${deckId}/cards/${dcId}`, { method: "PATCH", body: JSON.stringify(body) });

// Primers
export const getPrimer = (deckId: number) => request<Primer>(`/primers/${deckId}`);
export const savePrimer = (deckId: number, body: Partial<Primer>) =>
  request<Primer>(`/primers/${deckId}`, { method: "PUT", body: JSON.stringify(body) });

// Collection
export const getCollection = (search?: string) =>
  request<CollectionEntry[]>(`/collection/${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const addToCollection = (body: object) => request("/collection/", { method: "POST", body: JSON.stringify(body) });
export const updateCollectionCard = (id: number, body: object) =>
  request(`/collection/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteCollectionCard = (id: number) => request(`/collection/${id}`, { method: "DELETE" });

// Orders
export const getOrders = (source?: string) =>
  request<Order[]>(`/orders/${source ? `?source=${source}` : ""}`);
export const createOrder = (body: object) => request<Order>("/orders/", { method: "POST", body: JSON.stringify(body) });
export const updateOrderStatus = (id: number, status: string) =>
  request(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const addOrderItem = (orderId: number, body: object) =>
  request(`/orders/${orderId}/items`, { method: "POST", body: JSON.stringify(body) });
export const removeOrderItem = (orderId: number, itemId: number) =>
  request(`/orders/${orderId}/items/${itemId}`, { method: "DELETE" });
export const deleteOrder = (id: number) => request(`/orders/${id}`, { method: "DELETE" });

// Import
export const previewImport = (url: string) =>
  request<ImportPreview>("/import/preview", { method: "POST", body: JSON.stringify({ url }) });
export const doImport = (url: string, existingDeckId?: number) =>
  request<{ deck_id: number; name: string }>("/import/", {
    method: "POST",
    body: JSON.stringify({ url, existing_deck_id: existingDeckId ?? null }),
  });

// Types
export interface Deck {
  id: number;
  name: string;
  bracket: number;
  format: string;
  moxfield_url: string | null;
  has_proxies: boolean;
  card_count: number;
  commander: { scryfall_id: string; name: string; image_uri: string | null } | null;
  partner: { scryfall_id: string; name: string; image_uri: string | null } | null;
  created_at: string;
  updated_at: string;
}

export interface DeckCard {
  deck_card_id: number;
  scryfall_id: string;
  quantity: number;
  is_proxy: boolean;
  category: string;
  name: string;
  type_line: string;
  mana_cost: string | null;
  cmc: number;
  image_uri: string | null;
  colors: string[];
}

export interface Primer {
  id: number;
  deck_id: number;
  description: string;
  strategies: { title: string; body: string }[];
  combos: { card_ids: string[]; description: string }[];
  cards_of_note: { scryfall_id: string; note: string }[];
  tips: string[];
}

export interface CollectionEntry {
  id: number;
  scryfall_id: string;
  name: string;
  type_line: string;
  set_code: string;
  rarity: string;
  image_uri: string | null;
  colors: string[];
  quantity: number;
  foil: boolean;
  condition: string;
  in_deck_ids: number[];
}

export interface Order {
  id: number;
  source: string;
  status: string;
  for_deck_id: number | null;
  notes: string;
  created_at: string;
  items: OrderItem[];
  total_items: number;
  total_cents: number;
}

export interface OrderItem {
  id: number;
  scryfall_id: string;
  name: string;
  image_uri: string | null;
  quantity: number;
  price_cents: number;
  for_deck_id: number | null;
}

export interface ImportPreview {
  name: string;
  moxfield_id: string;
  format: string;
  commander_count: number;
  card_count: number;
  commanders: string[];
}
