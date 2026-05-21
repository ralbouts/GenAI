from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)  # cardmarket|libreproxies
    status = Column(String, default="pending")  # pending|ordered|shipped|delivered
    for_deck_id = Column(Integer, ForeignKey("decks.id"), nullable=True)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    scryfall_id = Column(String, ForeignKey("cards.scryfall_id"), nullable=False)
    quantity = Column(Integer, default=1)
    price_cents = Column(Integer, default=0)
    for_deck_id = Column(Integer, ForeignKey("decks.id"), nullable=True)

    order = relationship("Order", back_populates="items")
