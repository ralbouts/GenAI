from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Primer(Base):
    __tablename__ = "primers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    deck_id = Column(Integer, ForeignKey("decks.id"), nullable=False, unique=True)
    description = Column(Text, default="")
    strategies = Column(Text, default="[]")    # JSON: [{title, body}]
    combos = Column(Text, default="[]")        # JSON: [{card_ids[], description}]
    cards_of_note = Column(Text, default="[]") # JSON: [{scryfall_id, note}]
    tips = Column(Text, default="[]")          # JSON: [string]

    deck = relationship("Deck", back_populates="primer")
