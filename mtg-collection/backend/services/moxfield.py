import re
import httpx


def extract_deck_id(url: str) -> str | None:
    match = re.search(r"moxfield\.com/decks/([A-Za-z0-9_-]+)", url)
    return match.group(1) if match else None


async def fetch_deck(deck_id: str) -> dict:
    url = f"https://api2.moxfield.com/v2/decks/all/{deck_id}"
    headers = {
        "User-Agent": "MTGCollectionManager/1.0",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers, timeout=15)
        r.raise_for_status()
    return r.json()


def parse_deck(data: dict) -> dict:
    """Normalize Moxfield deck response into a flat structure."""
    boards = data.get("boards", {})

    def get_cards(board_name: str) -> list[dict]:
        board = boards.get(board_name, {})
        return [
            {
                "name": entry["card"]["name"],
                "scryfall_id": entry["card"].get("scryfall_id") or entry["card"].get("id"),
                "quantity": entry["quantity"],
                "board": board_name,
            }
            for entry in board.get("cards", {}).values()
        ]

    commanders = get_cards("commanders")
    mainboard = get_cards("mainboard")

    return {
        "name": data.get("name", "Imported Deck"),
        "moxfield_id": data.get("publicId") or data.get("id"),
        "format": data.get("format", "commander"),
        "commanders": commanders,
        "mainboard": mainboard,
    }
