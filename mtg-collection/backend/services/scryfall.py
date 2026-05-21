import asyncio
import json
import httpx
from sqlalchemy.orm import Session
from models.card import Card

SCRYFALL_BASE = "https://api.scryfall.com"
_last_request = 0.0


async def _get(url: str) -> dict:
    global _last_request
    now = asyncio.get_event_loop().time()
    wait = 0.1 - (now - _last_request)
    if wait > 0:
        await asyncio.sleep(wait)
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
    _last_request = asyncio.get_event_loop().time()
    return r.json()


def _extract_image(data: dict) -> tuple[str | None, str | None]:
    front = data.get("image_uris", {}).get("normal")
    back = None
    faces = data.get("card_faces", [])
    if not front and faces:
        front = faces[0].get("image_uris", {}).get("normal")
        if len(faces) > 1:
            back = faces[1].get("image_uris", {}).get("normal")
    return front, back


def _upsert_card(db: Session, data: dict) -> Card:
    front, back = _extract_image(data)
    card = db.get(Card, data["id"])
    if card is None:
        card = Card(scryfall_id=data["id"])
        db.add(card)
    card.name = data["name"]
    card.mana_cost = data.get("mana_cost")
    card.type_line = data.get("type_line")
    card.oracle_text = data.get("oracle_text")
    card.colors = json.dumps(data.get("colors", []))
    card.color_identity = json.dumps(data.get("color_identity", []))
    card.cmc = data.get("cmc")
    card.rarity = data.get("rarity")
    card.set_code = data.get("set")
    card.collector_number = data.get("collector_number")
    card.image_uri = front
    card.image_uri_back = back
    db.commit()
    db.refresh(card)
    return card


async def get_card_by_id(scryfall_id: str, db: Session) -> Card:
    card = db.get(Card, scryfall_id)
    if card:
        return card
    data = await _get(f"{SCRYFALL_BASE}/cards/{scryfall_id}")
    return _upsert_card(db, data)


async def get_card_by_name(name: str, db: Session) -> Card | None:
    existing = db.query(Card).filter(Card.name == name).first()
    if existing:
        return existing
    try:
        data = await _get(f"{SCRYFALL_BASE}/cards/named?exact={httpx.URL('', params={'exact': name}).params}")
        return _upsert_card(db, data)
    except httpx.HTTPStatusError:
        try:
            data = await _get(f"{SCRYFALL_BASE}/cards/named?fuzzy={name}")
            return _upsert_card(db, data)
        except httpx.HTTPStatusError:
            return None


async def search_cards(query: str) -> list[dict]:
    try:
        data = await _get(f"{SCRYFALL_BASE}/cards/search?q={query}&order=name")
        return data.get("data", [])
    except httpx.HTTPStatusError:
        return []
