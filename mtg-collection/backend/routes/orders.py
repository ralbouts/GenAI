from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.order import Order, OrderItem
from models.card import Card

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderCreate(BaseModel):
    source: str  # cardmarket|libreproxies
    for_deck_id: int | None = None
    notes: str = ""


class OrderItemAdd(BaseModel):
    scryfall_id: str
    quantity: int = 1
    price_cents: int = 0
    for_deck_id: int | None = None


class OrderStatusUpdate(BaseModel):
    status: str


def order_to_dict(order: Order, db: Session) -> dict:
    items = []
    for item in order.items:
        card = db.get(Card, item.scryfall_id)
        items.append({
            "id": item.id,
            "scryfall_id": item.scryfall_id,
            "name": card.name if card else item.scryfall_id,
            "image_uri": card.image_uri if card else None,
            "quantity": item.quantity,
            "price_cents": item.price_cents,
            "for_deck_id": item.for_deck_id,
        })
    return {
        "id": order.id,
        "source": order.source,
        "status": order.status,
        "for_deck_id": order.for_deck_id,
        "notes": order.notes,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": items,
        "total_items": sum(i["quantity"] for i in items),
        "total_cents": sum(i["price_cents"] * i["quantity"] for i in items),
    }


@router.get("/")
def list_orders(source: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Order)
    if source:
        query = query.filter(Order.source == source)
    return [order_to_dict(o, db) for o in query.order_by(Order.created_at.desc()).all()]


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order_to_dict(order, db)


@router.post("/")
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    order = Order(**body.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_to_dict(order, db)


@router.patch("/{order_id}/status")
def update_order_status(order_id: int, body: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = body.status
    db.commit()
    return {"ok": True}


@router.post("/{order_id}/items")
def add_order_item(order_id: int, body: OrderItemAdd, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    item = OrderItem(order_id=order_id, **body.model_dump())
    db.add(item)
    db.commit()
    return {"ok": True}


@router.delete("/{order_id}/items/{item_id}")
def remove_order_item(order_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.get(OrderItem, item_id)
    if not item or item.order_id != order_id:
        raise HTTPException(404, "Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    db.delete(order)
    db.commit()
    return {"ok": True}
