from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Card, Deck, DeckCard, CollectionCard, Primer, Order, OrderItem
from database import Base
from routes import decks, primers, collection, orders, import_deck

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MTG Collection Manager")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(decks.router)
app.include_router(primers.router)
app.include_router(collection.router)
app.include_router(orders.router)
app.include_router(import_deck.router)


@app.get("/health")
def health():
    return {"status": "ok"}
