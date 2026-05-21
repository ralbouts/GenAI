from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.deck import Deck, DeckCard
from models.collection import CollectionCard
from services import scryfall, moxfield

router = APIRouter(prefix="/import", tags=["import"])


class ImportRequest(BaseModel):
    url: str
    existing_deck_id: int | None = None  # if set, update this deck instead of creating new


@router.post("/preview")
async def preview_import(body: ImportRequest):
    deck_id = moxfield.extract_deck_id(body.url)
    if not deck_id:
        raise HTTPException(400, "Invalid Moxfield URL")
    try:
        raw = await moxfield.fetch_deck(deck_id)
    except Exception as e:
        raise HTTPException(502, f"Could not fetch deck from Moxfield: {e}")
    parsed = moxfield.parse_deck(raw)
    return {
        "name": parsed["name"],
        "moxfield_id": parsed["moxfield_id"],
        "format": parsed["format"],
        "commander_count": len(parsed["commanders"]),
        "card_count": sum(c["quantity"] for c in parsed["mainboard"]),
        "commanders": [c["name"] for c in parsed["commanders"]],
    }


@router.post("/")
async def do_import(body: ImportRequest, db: Session = Depends(get_db)):
    deck_id_str = moxfield.extract_deck_id(body.url)
    if not deck_id_str:
        raise HTTPException(400, "Invalid Moxfield URL")
    try:
        raw = await moxfield.fetch_deck(deck_id_str)
    except Exception as e:
        raise HTTPException(502, f"Could not fetch deck from Moxfield: {e}")
    parsed = moxfield.parse_deck(raw)

    if not parsed["commanders"]:
        raise HTTPException(400, "Deck has no commander")

    # Resolve commander card
    cmd_data = parsed["commanders"][0]
    commander = await scryfall.get_card_by_name(cmd_data["name"], db)
    if not commander:
        raise HTTPException(400, f"Commander '{cmd_data['name']}' not found on Scryfall")

    partner = None
    if len(parsed["commanders"]) > 1:
        partner = await scryfall.get_card_by_name(parsed["commanders"][1]["name"], db)

    # Create or update deck
    if body.existing_deck_id:
        deck = db.get(Deck, body.existing_deck_id)
        if not deck:
            raise HTTPException(404, "Deck not found")
        deck.name = parsed["name"]
        deck.commander_scryfall_id = commander.scryfall_id
        deck.partner_scryfall_id = partner.scryfall_id if partner else None
        deck.moxfield_url = body.url
        deck.moxfield_id = parsed["moxfield_id"]
        # Remove existing cards
        for dc in deck.cards:
            db.delete(dc)
        db.flush()
    else:
        deck = Deck(
            name=parsed["name"],
            commander_scryfall_id=commander.scryfall_id,
            partner_scryfall_id=partner.scryfall_id if partner else None,
            format=parsed["format"],
            moxfield_url=body.url,
            moxfield_id=parsed["moxfield_id"],
        )
        db.add(deck)
        db.flush()

    # Add commander as deck card
    db.add(DeckCard(deck_id=deck.id, scryfall_id=commander.scryfall_id, quantity=1, category="commander"))
    if partner:
        db.add(DeckCard(deck_id=deck.id, scryfall_id=partner.scryfall_id, quantity=1, category="commander"))

    # Resolve and add mainboard cards
    for entry in parsed["mainboard"]:
        card = await scryfall.get_card_by_name(entry["name"], db)
        if not card:
            continue
        category = _categorize(card.type_line or "")
        db.add(DeckCard(
            deck_id=deck.id,
            scryfall_id=card.scryfall_id,
            quantity=entry["quantity"],
            category=category,
        ))
        # Auto-add to collection if not present
        existing = db.query(CollectionCard).filter(CollectionCard.scryfall_id == card.scryfall_id).first()
        if not existing:
            db.add(CollectionCard(scryfall_id=card.scryfall_id, quantity=entry["quantity"]))

    db.commit()
    db.refresh(deck)
    return {"deck_id": deck.id, "name": deck.name}


def _categorize(type_line: str) -> str:
    t = type_line.lower()
    if "creature" in t:
        return "creature"
    if "instant" in t:
        return "instant"
    if "sorcery" in t:
        return "sorcery"
    if "artifact" in t:
        return "artifact"
    if "enchantment" in t:
        return "enchantment"
    if "planeswalker" in t:
        return "planeswalker"
    if "land" in t:
        return "land"
    return "other"
