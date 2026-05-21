from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    commander_scryfall_id = Column(String, ForeignKey("cards.scryfall_id"), nullable=False)
    partner_scryfall_id = Column(String, ForeignKey("cards.scryfall_id"), nullable=True)
    format = Column(String, default="commander")
    bracket = Column(Integer, default=2)
    moxfield_url = Column(String)
    moxfield_id = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    cards = relationship("DeckCard", back_populates="deck", cascade="all, delete-orphan")
    primer = relationship("Primer", back_populates="deck", uselist=False, cascade="all, delete-orphan")


class DeckCard(Base):
    __tablename__ = "deck_cards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False)
    scryfall_id = Column(String, ForeignKey("cards.scryfall_id"), nullable=False)
    quantity = Column(Integer, default=1)
    is_proxy = Column(Boolean, default=False)
    category = Column(String, default="mainboard")  # commander|creature|instant|sorcery|artifact|enchantment|planeswalker|land|other

    deck = relationship("Deck", back_populates="cards")
