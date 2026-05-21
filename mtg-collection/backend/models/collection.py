from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from database import Base


class CollectionCard(Base):
    __tablename__ = "collection"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scryfall_id = Column(String, ForeignKey("cards.scryfall_id"), nullable=False)
    quantity = Column(Integer, default=1)
    foil = Column(Boolean, default=False)
    condition = Column(String, default="NM")  # NM|LP|MP|HP|DMG
