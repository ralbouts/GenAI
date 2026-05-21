import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.primer import Primer
from models.deck import Deck

router = APIRouter(prefix="/primers", tags=["primers"])


class PrimerUpdate(BaseModel):
    description: str | None = None
    strategies: list | None = None
    combos: list | None = None
    cards_of_note: list | None = None
    tips: list | None = None


def primer_to_dict(p: Primer) -> dict:
    return {
        "id": p.id,
        "deck_id": p.deck_id,
        "description": p.description,
        "strategies": json.loads(p.strategies or "[]"),
        "combos": json.loads(p.combos or "[]"),
        "cards_of_note": json.loads(p.cards_of_note or "[]"),
        "tips": json.loads(p.tips or "[]"),
    }


@router.get("/{deck_id}")
def get_primer(deck_id: int, db: Session = Depends(get_db)):
    primer = db.query(Primer).filter(Primer.deck_id == deck_id).first()
    if not primer:
        primer = Primer(deck_id=deck_id)
        db.add(primer)
        db.commit()
        db.refresh(primer)
    return primer_to_dict(primer)


@router.put("/{deck_id}")
def upsert_primer(deck_id: int, body: PrimerUpdate, db: Session = Depends(get_db)):
    deck = db.get(Deck, deck_id)
    if not deck:
        raise HTTPException(404, "Deck not found")
    primer = db.query(Primer).filter(Primer.deck_id == deck_id).first()
    if not primer:
        primer = Primer(deck_id=deck_id)
        db.add(primer)
    if body.description is not None:
        primer.description = body.description
    if body.strategies is not None:
        primer.strategies = json.dumps(body.strategies)
    if body.combos is not None:
        primer.combos = json.dumps(body.combos)
    if body.cards_of_note is not None:
        primer.cards_of_note = json.dumps(body.cards_of_note)
    if body.tips is not None:
        primer.tips = json.dumps(body.tips)
    db.commit()
    db.refresh(primer)
    return primer_to_dict(primer)
