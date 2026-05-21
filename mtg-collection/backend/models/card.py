from sqlalchemy import Column, String, Float, Text
from database import Base


class Card(Base):
    __tablename__ = "cards"

    scryfall_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    mana_cost = Column(String)
    type_line = Column(String)
    oracle_text = Column(Text)
    colors = Column(String)        # JSON array stored as string e.g. '["W","U"]'
    color_identity = Column(String)
    cmc = Column(Float)
    rarity = Column(String)
    set_code = Column(String)
    collector_number = Column(String)
    image_uri = Column(String)
    image_uri_back = Column(String)  # for double-faced cards
