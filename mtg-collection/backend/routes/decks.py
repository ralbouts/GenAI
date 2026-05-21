import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.deck import Deck, DeckCard
from models.card import Card

router = APIRouter(prefix="/decks", tags=["decks"])


class DeckCreate(BaseModel):
    name: str
    commander_scryfall_id: str
    partner_scryfall_id: str | None = None
    format: str = "commander"
    bracket: int = 2
    moxfield_url: str | None = None


class DeckUpdate(BaseModel):
    name: str | None = None
    bracket: int | None = None
    moxfield_url: str | None = None


def deck_to_dict(deck: Deck, db: Session) -> dict:
    commander = db.get(Card, deck.commander_scryfall_id)
    partner = db.get(Card, deck.partner_scryfall_id) if deck.partner_scryfall_id else None
    has_proxies = any(c.is_proxy for c in deck.cards)
    return {
        "id": deck.id,
        "name": deck.name,
        "bracket": deck.bracket,
        "format": deck.format,
        "moxfield_url": deck.moxfield_url,
        "has_proxies": has_proxies,
        "card_count": sum(c.quantity for c in deck.cards),
        "commander": {"scryfall_id": commander.scryfall_id, "name": commander.name, "image_uri": commander.image_uri} if commander else None,
        "partner": {"scryfall_id": partner.scryfall_id, "name": partner.name, "image_uri": partner.image_uri} if partner else None,
        "created_at": deck.created_at.isoformat() if deck.created_at else None,
        "updated_at": deck.updated_at.isoformat() if deck.updated_at else None,
    }


@router.get("/")
def list_decks(db: Session = Depends(get_db)):
    decks = db.query(Deck).all()
    return [deck_to_dict(d, db) for d in decks]


@router.get("/{deck_id}")
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    return deck_to_dict(deck, db)


@router.get("/{deck_id}/cards")
def get_deck_cards(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    result = []
    for dc in deck.cards:
        card = db.get(Card, dc.scryfall_id)
        if card:
            result.append({
                "deck_card_id": dc.id,
                "scryfall_id": dc.scryfall_id,
                "quantity": dc.quantity,
                "is_proxy": dc.is_proxy,
                "category": dc.category,
                "name": card.name,
                "type_line": card.type_line,
                "mana_cost": card.mana_cost,
                "cmc": card.cmc,
                "image_uri": card.image_uri,
                "colors": json.loads(card.colors or "[]"),
            })
    return result


@router.post("/")
def create_deck(body: DeckCreate, db: Session = Depends(get_db)):
    deck = Deck(**body.model_dump())
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck_to_dict(deck, db)


@router.patch("/{deck_id}")
def update_deck(deck_id: int, body: DeckUpdate, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(deck, field, value)
    db.commit()
    db.refresh(deck)
    return deck_to_dict(deck, db)


@router.delete("/{deck_id}")
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    db.delete(deck)
    db.commit()
    return {"ok": True}


class DeckCardUpdate(BaseModel):
    is_proxy: bool | None = None
    quantity: int | None = None
    category: str | None = None


@router.patch("/{deck_id}/cards/{deck_card_id}")
def update_deck_card(deck_id: int, deck_card_id: int, body: DeckCardUpdate, db: Session = Depends(get_db)):
    dc = db.get(DeckCard, deck_card_id)
    if not dc or dc.deck_id != deck_id:
        raise HTTPException(404, "Card not found in deck")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(dc, field, value)
    db.commit()
    return {"ok": True}
