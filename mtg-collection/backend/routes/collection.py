import json
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.collection import CollectionCard
from models.card import Card
from models.deck import DeckCard

router = APIRouter(prefix="/collection", tags=["collection"])


class CollectionCardCreate(BaseModel):
    scryfall_id: str
    quantity: int = 1
    foil: bool = False
    condition: str = "NM"


class CollectionCardUpdate(BaseModel):
    quantity: int | None = None
    foil: bool | None = None
    condition: str | None = None


@router.get("/")
def list_collection(
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(CollectionCard).join(Card, CollectionCard.scryfall_id == Card.scryfall_id)
    if search:
        query = query.filter(Card.name.ilike(f"%{search}%"))
    items = query.all()

    result = []
    for item in items:
        card = db.get(Card, item.scryfall_id)
        if not card:
            continue
        in_decks = (
            db.query(DeckCard)
            .filter(DeckCard.scryfall_id == item.scryfall_id)
            .all()
        )
        result.append({
            "id": item.id,
            "scryfall_id": item.scryfall_id,
            "name": card.name,
            "type_line": card.type_line,
            "set_code": card.set_code,
            "rarity": card.rarity,
            "image_uri": card.image_uri,
            "colors": json.loads(card.colors or "[]"),
            "quantity": item.quantity,
            "foil": item.foil,
            "condition": item.condition,
            "in_deck_ids": list({dc.deck_id for dc in in_decks}),
        })
    return result


@router.post("/")
def add_to_collection(body: CollectionCardCreate, db: Session = Depends(get_db)):
    existing = db.query(CollectionCard).filter(
        CollectionCard.scryfall_id == body.scryfall_id,
        CollectionCard.foil == body.foil,
        CollectionCard.condition == body.condition,
    ).first()
    if existing:
        existing.quantity += body.quantity
        db.commit()
        return {"id": existing.id, "quantity": existing.quantity}
    item = CollectionCard(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "quantity": item.quantity}


@router.patch("/{item_id}")
def update_collection_card(item_id: int, body: CollectionCardUpdate, db: Session = Depends(get_db)):
    item = db.get(CollectionCard, item_id)
    if not item:
        raise HTTPException(404, "Not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    return {"ok": True}


@router.delete("/{item_id}")
def delete_collection_card(item_id: int, db: Session = Depends(get_db)):
    item = db.get(CollectionCard, item_id)
    if not item:
        raise HTTPException(404, "Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
